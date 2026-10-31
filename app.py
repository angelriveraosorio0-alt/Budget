"""Local budgeting website. Run with:  py -m streamlit run app.py
Your file is processed in memory on this computer and is never saved or sent anywhere.
"""
import pandas as pd
import streamlit as st

from budget import CATEGORIES, categorize_by_rules
from loader import build_clean_frame, guess_column

st.set_page_config(page_title="HealthyPockets", page_icon="💰", layout="wide")
st.title("💰 HealthyPockets")
st.caption("Runs only on this computer. Your file is never saved or uploaded anywhere.")

# ---------- Sidebar: load data ----------
st.sidebar.header("1. Load your transactions")
uploaded = st.sidebar.file_uploader("Choose your bank's CSV file", type="csv")
use_sample = st.sidebar.checkbox("Use sample (fake) data instead")

if use_sample:
    raw = pd.read_csv("sample_data/sample_transactions.csv")
elif uploaded is not None:
    raw = pd.read_csv(uploaded)
else:
    st.info("👈 Upload your bank's CSV file in the sidebar, or tick "
            "'Use sample data' to try it out.")
    st.stop()

# ---------- Sidebar: match columns ----------
st.sidebar.header("2. Match the columns")
cols = list(raw.columns)


def pick(label, keywords, allow_none=False):
    guess = guess_column(cols, keywords)
    options = ([None] if allow_none else []) + cols
    index = options.index(guess) if guess in options else 0
    return st.sidebar.selectbox(label, options, index=index)


date_col = pick("Date column", ["date", "posted"])
desc_col = pick("Description column", ["description", "details", "memo", "payee", "name"])

has_split = guess_column(cols, ["debit"]) and guess_column(cols, ["credit"])
mode_label = st.sidebar.radio(
    "How are amounts shown?",
    ["One amount column", "Separate debit and credit columns"],
    index=1 if has_split else 0,
)

amount_col = debit_col = credit_col = None
spending_is_positive = False
if mode_label == "One amount column":
    mode = "one"
    amount_col = pick("Amount column", ["amount"])
    spending_is_positive = st.sidebar.checkbox(
        "Spending shows as positive numbers in my file")
else:
    mode = "split"
    debit_col = pick("Debit (money out) column", ["debit", "withdraw"])
    credit_col = pick("Credit (money in) column", ["credit", "deposit"])

df = build_clean_frame(raw, date_col, desc_col, mode, amount_col,
                       debit_col, credit_col, spending_is_positive)
if df.empty:
    st.error("No valid rows found. Check that the Date column is correct.")
    st.stop()

df["category"] = df["description"].apply(categorize_by_rules)
df["month"] = df["date"].dt.to_period("M").astype(str)

# ---------- Choose month ----------
months = sorted(df["month"].unique(), reverse=True)
choice = st.selectbox("Month", ["All months"] + months)
view = df if choice == "All months" else df[df["month"] == choice]

income = view.loc[view["amount"] > 0, "amount"].sum()
spending = -view.loc[view["amount"] < 0, "amount"].sum()

c1, c2, c3 = st.columns(3)
c1.metric("Income", f"${income:,.2f}")
c2.metric("Spending", f"${spending:,.2f}")
c3.metric("Net (left over)", f"${income - spending:,.2f}")

# ---------- Charts ----------
left, right = st.columns(2)
spend = view[view["amount"] < 0].copy()
spend["amount"] = spend["amount"].abs()

with left:
    st.subheader("Spending by category")
    by_cat = spend.groupby("category")["amount"].sum().sort_values(ascending=False)
    if by_cat.empty:
        st.write("No spending in this period.")
    else:
        st.bar_chart(by_cat)
        table = by_cat.reset_index()
        table["% of spending"] = (table["amount"] / table["amount"].sum() * 100).round(1)
        table["amount"] = table["amount"].map("${:,.2f}".format)
        st.dataframe(table, hide_index=True, use_container_width=True)

with right:
    st.subheader("Spending by month")
    all_spend = df[df["amount"] < 0].copy()
    all_spend["amount"] = all_spend["amount"].abs()
    st.bar_chart(all_spend.groupby("month")["amount"].sum())

# ---------- Transactions ----------
st.subheader("Transactions")
other = view[view["category"] == "Other"]
if len(other):
    st.warning(f"{len(other)} transaction(s) are in 'Other' because no rule "
               "matched. You can add keywords to RULES in budget.py.")
st.dataframe(
    view[["date", "description", "amount", "category"]]
    .sort_values("date", ascending=False),
    hide_index=True, use_container_width=True,
)
