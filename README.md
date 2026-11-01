# 💰 HealthyPockets

A simple, privacy-first budgeting tool. See where your money goes, what's left each
month, and whether you're on track for your savings goals.

## Features

- **Upload a bank CSV** and get spending by category, income vs. spending, and a
  month-by-month view. Columns are matched automatically, and you can adjust them.
- **Enter numbers manually** if you'd rather not use bank data: type in your income,
  monthly expenses and savings goals, and see what you can afford to save.
- **Savings goals** with progress bars and the monthly amount needed to reach each one.
- **Sample data included** so you can try it without any real information.

## Privacy

- When you run HealthyPockets on your own computer, your data is processed in memory
  only. It is not saved to disk and not sent to any other service.
- The app has no login. Only run it on a computer and network you trust.
- If you try a **hosted/demo copy** of this app, your input passes through the host's
  server. Use the sample data or made-up numbers there, **never real bank files**.
- Never commit real bank files or your `.env` file to GitHub. The included
  `.gitignore` blocks them by default.

## Run it yourself

You need [Python 3](https://www.python.org/downloads/) installed.

1. Download this repo (**Code → Download ZIP** on GitHub, or `git clone`).
2. Open a terminal in the project folder and install the requirements:

        py -m pip install -r requirements.txt

3. Start the app:

        py -m streamlit run app.py

A browser tab opens at http://localhost:8501. Press `Ctrl+C` in the terminal to stop it.

## How to use it

1. Pick **Upload a bank CSV** or **Enter numbers manually** at the top of the sidebar.
2. For a CSV: upload your bank's file (or tick *Use sample data*), then check that the
   Date, Description and Amount columns are matched correctly.
3. For manual entry: fill in your income, edit the expense table, and add your savings goals.

## Text version

    py budget.py sample_data/sample_transactions.csv

## Customizing categories

Transactions are sorted into categories using simple keyword rules in `budget.py`.
Anything that doesn't match lands in **Other**. Add keywords to `RULES` to fix that.

## Disclaimer

HealthyPockets is a personal project, not financial advice. Categories are guessed
from keywords and may be wrong, so check the numbers against your bank statements.

## Built with

Python, [Streamlit](https://streamlit.io/) and pandas.
