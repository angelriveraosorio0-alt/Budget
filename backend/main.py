"""HealthyPockets API.

Stateless by design: uploaded files are read into memory, analysed and thrown away.
Nothing is written to disk and nothing is sent to any other service.

Run from the project root:  py -m uvicorn backend.main:app --reload
"""
import io
import os
import sys
from pathlib import Path
from typing import Optional

import pandas as pd
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Reuse the existing category rules and CSV helpers that live in the project root.
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
from budget import CATEGORIES, categorize_by_rules  # noqa: E402
from loader import build_clean_frame, guess_column  # noqa: E402

SAMPLE_CSV = ROOT / "sample_data" / "sample_transactions.csv"
MAX_UPLOAD_BYTES = 10 * 1024 * 1024
MAX_TRANSACTIONS = 5000
EXPENSE_CATEGORIES = [c for c in CATEGORIES if c != "Income"]

app = FastAPI(title="HealthyPockets API")

_default_origins = "http://localhost:3000,http://127.0.0.1:3000"
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("HEALTHYPOCKETS_ORIGINS", _default_origins).split(","),
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


# ---------- helpers ----------
async def load_raw(file: Optional[UploadFile], use_sample: bool) -> pd.DataFrame:
    """Read the uploaded CSV (or the bundled sample) into memory."""
    if use_sample:
        raw = pd.read_csv(SAMPLE_CSV)
    else:
        if file is None:
            raise HTTPException(400, "Upload a CSV file or choose the sample data.")
        data = await file.read(MAX_UPLOAD_BYTES + 1)
        if len(data) > MAX_UPLOAD_BYTES:
            raise HTTPException(413, "That file is too large (10 MB limit).")
        raw = None
        for encoding in ("utf-8-sig", "latin-1"):
            try:
                raw = pd.read_csv(io.BytesIO(data), encoding=encoding)
                break
            except UnicodeDecodeError:
                continue
            except (pd.errors.ParserError, pd.errors.EmptyDataError):
                raise HTTPException(400, "That doesn't look like a valid CSV file.")
        if raw is None:
            raise HTTPException(400, "Could not read that file's text encoding.")
    raw.columns = [str(c) for c in raw.columns]
    return raw


def money(value: float) -> float:
    return round(float(value), 2)


# ---------- meta ----------
@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/meta")
def meta():
    return {"expense_categories": EXPENSE_CATEGORIES}


# ---------- CSV mode ----------
@app.post("/api/columns")
async def columns(file: Optional[UploadFile] = File(None), use_sample: bool = Form(False)):
    """Read a CSV and guess which columns hold the date, description and amounts."""
    raw = await load_raw(file, use_sample)
    cols = list(raw.columns)
    debit = guess_column(cols, ["debit", "withdraw"])
    credit = guess_column(cols, ["credit", "deposit"])
    return {
        "columns": cols,
        "rows": len(raw),
        "date_col": guess_column(cols, ["date", "posted"]),
        "desc_col": guess_column(cols, ["description", "details", "memo", "payee", "name"]),
        "amount_col": guess_column(cols, ["amount"]),
        "debit_col": debit,
        "credit_col": credit,
        "mode": "split" if debit and credit else "one",
    }


@app.post("/api/analyze")
async def analyze(
    file: Optional[UploadFile] = File(None),
    use_sample: bool = Form(False),
    date_col: str = Form(...),
    desc_col: str = Form(...),
    mode: str = Form("one"),
    amount_col: Optional[str] = Form(None),
    debit_col: Optional[str] = Form(None),
    credit_col: Optional[str] = Form(None),
    spending_is_positive: bool = Form(False),
    month: Optional[str] = Form(None),
):
    raw = await load_raw(file, use_sample)
    if mode not in ("one", "split"):
        raise HTTPException(400, "mode must be 'one' or 'split'.")

    needed = [date_col, desc_col] + ([amount_col] if mode == "one" else [debit_col, credit_col])
    for col in needed:
        if not col or col not in raw.columns:
            raise HTTPException(400, f"Column '{col}' was not found in the file.")

    try:
        df = build_clean_frame(raw, date_col, desc_col, mode, amount_col,
                               debit_col, credit_col, spending_is_positive)
    except (ValueError, KeyError, TypeError):
        raise HTTPException(400, "Could not read the file with those column choices.")
    if df.empty:
        raise HTTPException(400, "No valid rows found. Check that the Date column is correct.")

    df["category"] = df["description"].apply(categorize_by_rules)
    df["month"] = df["date"].dt.to_period("M").astype(str)

    months = sorted(df["month"].unique(), reverse=True)
    view = df if month in (None, "", "All months") or month not in months \
        else df[df["month"] == month]

    income = view.loc[view["amount"] > 0, "amount"].sum()
    spending = -view.loc[view["amount"] < 0, "amount"].sum()

    spend = view[view["amount"] < 0].copy()
    spend["amount"] = spend["amount"].abs()
    by_cat = spend.groupby("category")["amount"].sum().sort_values(ascending=False)
    cat_total = by_cat.sum()
    by_category = [
        {"category": cat, "amount": money(amt),
         "percent": round(float(amt / cat_total * 100), 1) if cat_total else 0.0}
        for cat, amt in by_cat.items()
    ]

    all_spend = df[df["amount"] < 0].copy()
    all_spend["amount"] = all_spend["amount"].abs()
    by_month = [{"month": m, "amount": money(a)}
                for m, a in all_spend.groupby("month")["amount"].sum().sort_index().items()]

    ordered = view.sort_values("date", ascending=False)
    transactions = [
        {"date": row.date.strftime("%Y-%m-%d"), "description": row.description,
         "amount": money(row.amount), "category": row.category}
        for row in ordered.head(MAX_TRANSACTIONS).itertuples()
    ]

    return {
        "months": months,
        "summary": {"income": money(income), "spending": money(spending),
                    "net": money(income - spending)},
        "by_category": by_category,
        "by_month": by_month,
        "transactions": transactions,
        "transaction_count": len(view),
        "other_count": int((view["category"] == "Other").sum()),
    }


# ---------- Manual mode ----------
class Expense(BaseModel):
    category: str = Field(max_length=60)
    amount: float = Field(ge=0, le=1e9)


class Goal(BaseModel):
    goal: str = Field(max_length=80)
    target: float = Field(ge=0, le=1e9)
    saved_so_far: float = Field(default=0, ge=0, le=1e9)
    months: int = Field(ge=1, le=1200)


class PlanRequest(BaseModel):
    income: float = Field(ge=0, le=1e9)
    expenses: list[Expense] = Field(default_factory=list, max_length=200)
    goals: list[Goal] = Field(default_factory=list, max_length=50)


@app.post("/api/plan")
def plan(req: PlanRequest):
    """Work out what's left each month and how much to save for each goal."""
    total_expenses = sum(e.amount for e in req.expenses)
    left_over = req.income - total_expenses

    by_category: dict[str, float] = {}
    for e in req.expenses:
        by_category[e.category] = by_category.get(e.category, 0.0) + e.amount
    by_category_list = [{"category": c, "amount": money(a)}
                        for c, a in sorted(by_category.items(), key=lambda kv: -kv[1]) if a > 0]

    goals = []
    for g in req.goals:
        still_needed = max(g.target - g.saved_so_far, 0.0)
        progress = min(g.saved_so_far / g.target, 1.0) if g.target > 0 else 1.0
        goals.append({
            "goal": g.goal, "target": money(g.target), "saved_so_far": money(g.saved_so_far),
            "months": g.months, "still_needed": money(still_needed),
            "save_per_month": money(still_needed / g.months), "progress": round(progress, 4),
        })

    needed = sum(g["save_per_month"] for g in goals)
    cushion = left_over - needed
    if not goals:
        status = "no_goals"
    elif needed == 0:
        status = "done"
    elif left_over >= needed:
        status = "on_track"
    elif left_over > 0:
        status = "short"
    else:
        status = "no_money"

    return {
        "income": money(req.income),
        "total_expenses": money(total_expenses),
        "left_over": money(left_over),
        "by_category": by_category_list,
        "goals": goals,
        "needed_per_month": money(needed),
        "cushion": money(cushion),
        "shortfall": money(max(-cushion, 0.0)),
        "status": status,
    }
