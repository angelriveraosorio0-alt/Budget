# HealthyPockets

Local-first budgeting. Your real data stays on your computer.

## Website version (recommended)
    py -m pip install -r requirements.txt
    py -m streamlit run app.py

A browser tab opens at http://localhost:8501. Upload your bank CSV in the sidebar.
Press Ctrl+C in the black window to stop it.

## Text version
    py budget.py sample_data/sample_transactions.csv

## Privacy rules
- Uploaded files are processed in memory and never saved.
- Never commit real bank files or `.env` to GitHub.
