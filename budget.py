"""Local-first budgeting tool.

Usage:
    python budget.py sample_data/sample_transactions.csv
    python budget.py data/my_transactions.csv --ai     # AI for unknown items
"""
import argparse
import json
import os
import re
from pathlib import Path

import pandas as pd

CACHE_FILE = Path("data/category_cache.json")  # gitignored

CATEGORIES = ["Income", "Housing", "Groceries", "Dining", "Transport",
              "Utilities", "Subscriptions", "Shopping", "Personal Care", "Other"]

# Simple keyword rules, checked first (free, fast, fully private).
RULES = {
    "Income": ["payroll", "salary", "deposit"],
    "Housing": ["rent", "mortgage"],
    "Groceries": ["heb", "kroger", "grocery", "whole foods", "walmart"],
    "Dining": ["chipotle", "taco", "restaurant", "cafe", "coffee", "pizza"],
    "Transport": ["shell", "exxon", "chevron", "uber", "lyft", "fuel"],
    "Utilities": ["water", "electric", "internet", "util"],
    "Subscriptions": ["netflix", "spotify", "hulu", "subscription"],
    "Shopping": ["amazon", "target", "mktplace"],
    "Personal Care": ["barber", "salon", "gym"],
}


def categorize_by_rules(description: str) -> str:
    text = description.lower()
    for category, keywords in RULES.items():
        if any(k in text for k in keywords):
            return category
    return "Other"


def scrub(description: str) -> str:
    """Remove long digit runs and emails before anything leaves your machine."""
    description = re.sub(r"\S+@\S+", "[email]", description)
    return re.sub(r"\d{4,}", "[num]", description)


def load_cache() -> dict:
    if CACHE_FILE.exists():
        return json.loads(CACHE_FILE.read_text())
    return {}


def save_cache(cache: dict) -> None:
    CACHE_FILE.parent.mkdir(exist_ok=True)
    CACHE_FILE.write_text(json.dumps(cache, indent=2))


def categorize_with_ai(descriptions: list[str]) -> dict:
    """Ask Claude to categorize unknown merchants. Only scrubbed text is sent."""
    from dotenv import load_dotenv
    import anthropic

    load_dotenv()
    cache = load_cache()
    todo = [d for d in descriptions if d not in cache]
    if todo:
        client = anthropic.Anthropic()  # reads ANTHROPIC_API_KEY from env
        scrubbed = {d: scrub(d) for d in todo}
        prompt = (
            f"Categorize each transaction description into one of: {CATEGORIES}.\n"
            "Reply with ONLY a JSON object mapping each description to a category.\n\n"
            + json.dumps(list(scrubbed.values()))
        )
        resp = client.messages.create(
            model=os.getenv("BUDGET_MODEL", "claude-sonnet-5-5"),
            max_tokens=1000,
            messages=[{"role": "user", "content": prompt}],
        )
        text = resp.content[0].text.replace("```json", "").replace("```", "").strip()
        result = json.loads(text)
        for original, clean in scrubbed.items():
            category = result.get(clean, "Other")
            cache[original] = category if category in CATEGORIES else "Other"
        save_cache(cache)
    return cache


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("csv_path")
    parser.add_argument("--ai", action="store_true",
                        help="use AI for items the rules can't categorize")
    args = parser.parse_args()

    df = pd.read_csv(args.csv_path, parse_dates=["date"])
    df["category"] = df["description"].apply(categorize_by_rules)

    if args.ai:
        unknown = df.loc[df["category"] == "Other", "description"].unique().tolist()
        if unknown:
            cache = categorize_with_ai(unknown)
            mask = df["category"] == "Other"
            df.loc[mask, "category"] = df.loc[mask, "description"].map(cache).fillna("Other")

    df["month"] = df["date"].dt.to_period("M")
    income = df[df["amount"] > 0].groupby("month")["amount"].sum()
    spending = df[df["amount"] < 0].copy()
    spending["amount"] = spending["amount"].abs()

    for month, group in spending.groupby("month"):
        print(f"\n=== {month} ===")
        print(f"Income:   ${income.get(month, 0):>10,.2f}")
        total = group["amount"].sum()
        print(f"Spending: ${total:>10,.2f}")
        print(f"Net:      ${income.get(month, 0) - total:>10,.2f}\n")
        by_cat = group.groupby("category")["amount"].sum().sort_values(ascending=False)
        for cat, amt in by_cat.items():
            print(f"  {cat:<15} ${amt:>9,.2f}  ({amt / total:>5.1%})")


if __name__ == "__main__":
    main()
