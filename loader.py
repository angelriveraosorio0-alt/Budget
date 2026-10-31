"""Helpers that turn a bank's CSV into the clean format the budget tool uses."""
import re

import pandas as pd


def guess_column(columns, keywords):
    """Pick the column whose name contains one of the keywords."""
    for key in keywords:
        for col in columns:
            if key in str(col).lower():
                return col
    return None


def to_number(series: pd.Series) -> pd.Series:
    """Convert text like '$1,234.50', '(45.00)' or '-12' into numbers."""
    def convert(value):
        if pd.isna(value):
            return 0.0
        text = str(value).strip()
        if text == "":
            return 0.0
        negative = text.startswith("(") and text.endswith(")") or text.startswith("-")
        cleaned = re.sub(r"[^0-9.]", "", text)
        if cleaned == "":
            return 0.0
        number = float(cleaned)
        return -number if negative else number

    return series.apply(convert)


def build_clean_frame(raw, date_col, desc_col, mode,
                      amount_col=None, debit_col=None, credit_col=None,
                      spending_is_positive=False):
    """Return a DataFrame with columns: date, description, amount.

    Spending is negative, income is positive.
    """
    df = pd.DataFrame()
    df["date"] = pd.to_datetime(raw[date_col], errors="coerce")
    df["description"] = raw[desc_col].astype(str)

    if mode == "one":
        amount = to_number(raw[amount_col])
        if spending_is_positive:
            amount = -amount
    else:
        debit = to_number(raw[debit_col]).abs()
        credit = to_number(raw[credit_col]).abs()
        amount = credit - debit

    df["amount"] = amount
    df = df.dropna(subset=["date"]).reset_index(drop=True)
    return df
