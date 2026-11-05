"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { analyze, fetchColumns } from "@/lib/api";
import { DARK_GREEN, GREEN, money } from "@/lib/format";
import type { Analysis, ColumnInfo } from "@/lib/types";
import Metric from "./Metric";

type Selection = {
  dateCol: string;
  descCol: string;
  amountCol: string;
  debitCol: string;
  creditCol: string;
  mode: "one" | "split";
  spendingIsPositive: boolean;
};

const ALL_MONTHS = "All months";

function ColumnSelect({
  label,
  value,
  columns,
  onChange,
}: {
  label: string;
  value: string;
  columns: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="field">
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {columns.map((c) => (
          <option key={c}>{c}</option>
        ))}
      </select>
    </label>
  );
}

export default function CsvMode() {
  const [file, setFile] = useState<File | null>(null);
  const [useSample, setUseSample] = useState(false);
  const [info, setInfo] = useState<ColumnInfo | null>(null);
  const [sel, setSel] = useState<Selection | null>(null);
  const [month, setMonth] = useState(ALL_MONTHS);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadColumns(nextFile: File | null, nextSample: boolean) {
    setAnalysis(null);
    setMonth(ALL_MONTHS);
    if (!nextFile && !nextSample) {
      setInfo(null);
      setSel(null);
      setError(null);
      return;
    }
    try {
      const c = await fetchColumns(nextFile, nextSample);
      const first = c.columns[0] ?? "";
      setInfo(c);
      setSel({
        dateCol: c.date_col ?? first,
        descCol: c.desc_col ?? first,
        amountCol: c.amount_col ?? first,
        debitCol: c.debit_col ?? first,
        creditCol: c.credit_col ?? first,
        mode: c.mode,
        spendingIsPositive: false,
      });
      setError(null);
    } catch (err) {
      setInfo(null);
      setSel(null);
      setError(err instanceof Error ? err.message : "Could not read that file.");
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0] ?? null;
    setFile(picked);
    setUseSample(false);
    void loadColumns(picked, false);
  }

  function onSampleChange(checked: boolean) {
    setUseSample(checked);
    void loadColumns(checked ? null : file, checked);
  }

  // Ask the Python backend to crunch the numbers whenever a choice changes.
  useEffect(() => {
    if (!info || !sel) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      analyze({ file, useSample, ...sel, month }, controller.signal)
        .then((a) => {
          setAnalysis(a);
          setError(null);
        })
        .catch((err: Error) => {
          if (err.name === "AbortError") return;
          setAnalysis(null);
          setError(err.message);
        });
    }, 150);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [info, sel, month, file, useSample]);

  const patch = (p: Partial<Selection>) => setSel((s) => (s ? { ...s, ...p } : s));

  return (
    <div>
      <h2 className="section-title" style={{ marginTop: 0 }}>
        1. Load your transactions
      </h2>
      <div className="card stack">
        <label className="field">
          Choose your bank&apos;s CSV file
          <input className="file-input" type="file" accept=".csv,text/csv" onChange={onFileChange} />
        </label>
        <label className="check-row">
          <input
            type="checkbox"
            checked={useSample}
            onChange={(e) => onSampleChange(e.target.checked)}
          />
          Use sample (fake) data instead
        </label>
      </div>

      {error && <div className="alert error">{error}</div>}

      {!info && !error && (
        <div className="alert info">
          👆 Upload your bank&apos;s CSV file above, or tick &apos;Use sample data&apos; to try it
          out.
        </div>
      )}

      {info && sel && (
        <>
          <h2 className="section-title">2. Match the columns</h2>
          <div className="card stack">
            <div className="grid-2">
              <ColumnSelect
                label="Date column"
                value={sel.dateCol}
                columns={info.columns}
                onChange={(v) => patch({ dateCol: v })}
              />
              <ColumnSelect
                label="Description column"
                value={sel.descCol}
                columns={info.columns}
                onChange={(v) => patch({ descCol: v })}
              />
            </div>
            <div className="radio-group" role="radiogroup" aria-label="How are amounts shown?">
              <b>How are amounts shown?</b>
              <label className="radio-row">
                <input
                  type="radio"
                  name="amount-mode"
                  checked={sel.mode === "one"}
                  onChange={() => patch({ mode: "one" })}
                />
                One amount column
              </label>
              <label className="radio-row">
                <input
                  type="radio"
                  name="amount-mode"
                  checked={sel.mode === "split"}
                  onChange={() => patch({ mode: "split" })}
                />
                Separate debit and credit columns
              </label>
            </div>
            {sel.mode === "one" ? (
              <>
                <ColumnSelect
                  label="Amount column"
                  value={sel.amountCol}
                  columns={info.columns}
                  onChange={(v) => patch({ amountCol: v })}
                />
                <label className="check-row">
                  <input
                    type="checkbox"
                    checked={sel.spendingIsPositive}
                    onChange={(e) => patch({ spendingIsPositive: e.target.checked })}
                  />
                  Spending shows as positive numbers in my file
                </label>
              </>
            ) : (
              <div className="grid-2">
                <ColumnSelect
                  label="Debit (money out) column"
                  value={sel.debitCol}
                  columns={info.columns}
                  onChange={(v) => patch({ debitCol: v })}
                />
                <ColumnSelect
                  label="Credit (money in) column"
                  value={sel.creditCol}
                  columns={info.columns}
                  onChange={(v) => patch({ creditCol: v })}
                />
              </div>
            )}
          </div>
        </>
      )}

      {analysis && (
        <>
          <h2 className="section-title">3. Your budget</h2>
          <label className="field" style={{ maxWidth: 280 }}>
            Month
            <select value={month} onChange={(e) => setMonth(e.target.value)}>
              <option>{ALL_MONTHS}</option>
              {analysis.months.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </label>

          <div className="metrics">
            <Metric label="Income" value={money(analysis.summary.income)} />
            <Metric label="Spending" value={money(analysis.summary.spending)} />
            <Metric
              label="Net (left over)"
              value={money(analysis.summary.net)}
              bad={analysis.summary.net < 0}
            />
          </div>

          <div className="grid-2">
            <div>
              <h3>Spending by category</h3>
              {analysis.by_category.length === 0 ? (
                <p className="muted">No spending in this period.</p>
              ) : (
                <>
                  <div className="card" style={{ height: 280 }}>
                    <ResponsiveContainer>
                      <BarChart data={analysis.by_category}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="category" tick={{ fontSize: 11 }} interval={0} angle={-30} textAnchor="end" height={60} />
                        <YAxis tickFormatter={(v) => `$${v}`} width={60} />
                        <Tooltip formatter={(v) => money(Number(v))} />
                        <Bar
                          dataKey="amount"
                          fill={GREEN}
                          stroke={DARK_GREEN}
                          strokeWidth={2}
                          radius={[6, 6, 0, 0]}
                          isAnimationActive={false}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="table-wrap" style={{ marginTop: 16 }}>
                    <table className="tbl">
                      <thead>
                        <tr>
                          <th>Category</th>
                          <th className="num">Amount</th>
                          <th className="num">% of spending</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analysis.by_category.map((c) => (
                          <tr key={c.category}>
                            <td>{c.category}</td>
                            <td className="num">{money(c.amount)}</td>
                            <td className="num">{c.percent.toFixed(1)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

            <div>
              <h3>Spending by month</h3>
              <div className="card" style={{ height: 280 }}>
                <ResponsiveContainer>
                  <BarChart data={analysis.by_month}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={(v) => `$${v}`} width={60} />
                    <Tooltip formatter={(v) => money(Number(v))} />
                    <Bar
                      dataKey="amount"
                      fill="#16a34a"
                      stroke={DARK_GREEN}
                      strokeWidth={2}
                      radius={[6, 6, 0, 0]}
                      isAnimationActive={false}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <h3 style={{ marginTop: 24 }}>Transactions</h3>
          {analysis.other_count > 0 && (
            <div className="alert warn">
              {analysis.other_count} transaction(s) are in &apos;Other&apos; because no rule
              matched. You can add keywords to RULES in budget.py.
            </div>
          )}
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th className="num">Amount</th>
                  <th>Category</th>
                </tr>
              </thead>
              <tbody>
                {analysis.transactions.map((t, i) => (
                  <tr key={i}>
                    <td>{t.date}</td>
                    <td>{t.description}</td>
                    <td className="num">{money(t.amount)}</td>
                    <td>{t.category}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {analysis.transaction_count > analysis.transactions.length && (
            <p className="muted">
              Showing the newest {analysis.transactions.length} of {analysis.transaction_count}{" "}
              transactions.
            </p>
          )}
        </>
      )}
    </div>
  );
}
