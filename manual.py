"""Manual entry mode: type in income, expenses and savings goals by hand.
Everything stays in this browser session. Nothing is saved or sent anywhere.
"""
import pandas as pd
import streamlit as st

from budget import CATEGORIES

EXPENSE_CATEGORIES = [c for c in CATEGORIES if c != "Income"]


def render():
    st.subheader("✍️ Enter your numbers by hand")
    st.caption("No bank file needed. Fill in the boxes below; the totals update as you type.")

    income = st.number_input("Monthly income ($, after tax)", min_value=0.0,
                             step=50.0, format="%.2f")

    st.markdown("**Monthly expenses** - click a cell to edit, use the + row at the bottom to add more.")
    expenses = st.data_editor(
        pd.DataFrame({"category": ["Housing", "Groceries", "Transport"],
                      "amount": [0.0, 0.0, 0.0]}),
        num_rows="dynamic", hide_index=True, use_container_width=True,
        key="manual_expenses",
        column_config={
            "category": st.column_config.SelectboxColumn(
                "Category", options=EXPENSE_CATEGORIES, required=True),
            "amount": st.column_config.NumberColumn(
                "Amount per month", min_value=0.0, format="$%.2f", required=True),
        },
    )
    expenses = expenses.dropna(subset=["category"]).fillna({"amount": 0.0})
    total_expenses = float(expenses["amount"].sum())
    left_over = income - total_expenses

    c1, c2, c3 = st.columns(3)
    c1.metric("Income", f"${income:,.2f}")
    c2.metric("Expenses", f"${total_expenses:,.2f}")
    c3.metric("Left over each month", f"${left_over:,.2f}")

    by_cat = (expenses.groupby("category")["amount"].sum()
              .sort_values(ascending=False))
    by_cat = by_cat[by_cat > 0]
    if not by_cat.empty:
        st.subheader("Expenses by category")
        st.bar_chart(by_cat, color="#22C55E")

    # ---------- Savings goals ----------
    st.subheader("🎯 Savings goals")
    st.markdown("**Add a goal** - how much you want, how much you already have, "
                "and how many months you want to take.")
    goals = st.data_editor(
        pd.DataFrame({"goal": ["Emergency fund"], "target": [1000.0],
                      "saved_so_far": [0.0], "months": [12]}),
        num_rows="dynamic", hide_index=True, use_container_width=True,
        key="manual_goals",
        column_config={
            "goal": st.column_config.TextColumn("Goal", required=True),
            "target": st.column_config.NumberColumn(
                "Target amount", min_value=0.0, format="$%.2f", required=True),
            "saved_so_far": st.column_config.NumberColumn(
                "Saved so far", min_value=0.0, format="$%.2f"),
            "months": st.column_config.NumberColumn(
                "Months to reach it", min_value=1, step=1, required=True),
        },
    )
    goals = goals.dropna(subset=["goal", "target", "months"]).fillna({"saved_so_far": 0.0})
    if goals.empty:
        st.info("Add a goal above to see how much to save each month.")
        return

    goals = goals.copy()
    goals["still_needed"] = (goals["target"] - goals["saved_so_far"]).clip(lower=0)
    goals["save_per_month"] = goals["still_needed"] / goals["months"].clip(lower=1)
    goals["progress"] = (goals["saved_so_far"] / goals["target"].where(goals["target"] > 0)
                         ).fillna(1.0).clip(upper=1.0)

    for _, g in goals.iterrows():
        with st.container(border=True):
            st.markdown(f"**{g['goal']}** - \\${g['saved_so_far']:,.2f} of \\${g['target']:,.2f}")
            st.progress(float(g["progress"]))
            st.caption(f"Save \\${g['save_per_month']:,.2f} per month for "
                       f"{int(g['months'])} months to get there.")

    needed = float(goals["save_per_month"].sum())
    st.markdown(f"**All goals together need \\${needed:,.2f} per month.**")
    if needed == 0:
        st.success("You've already reached every goal listed. 🎉")
    elif left_over >= needed:
        st.success(f"You're on track. After expenses you have \\${left_over:,.2f} left, "
                   f"which covers the \\${needed:,.2f} you need.")
    elif left_over > 0:
        st.warning(f"You're ${needed - left_over:,.2f} per month short. Try giving "
                   "yourself more months, or trimming an expense category.")
    else:
        st.error("Your expenses are at or above your income, so there's nothing left to "
                 "save yet. Lowering a category above is the quickest fix.")
