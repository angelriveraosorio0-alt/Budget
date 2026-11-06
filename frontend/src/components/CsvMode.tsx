"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { analyze, fetchColumns } from "@/lib/api";
import Icon from "./Icon";
import { GREEN, money } from "@/lib/format";
import type { Analysis, ColumnInfo } from "@/lib/types";
import PageHeader from "./PageHeader";
import Pill from "./Pill";
import StatCard from "./StatCard";

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
  const [settingsOpen, setSettingsOpen] = useState(false);
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
      // Open the column settings only when auto-detect couldn't find everything.
      const found =
        c.date_col && c.desc_col && (c.mode === "split" ? c.debit_col && c.credit_col : c.amount_col);
      setSettingsOpen(!found);
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

  const others = analysis ? analysis.transactions.filter((t) => t.category === "Other") : [];
  const top = analysis?.by_category[0];

  return (
    <div>
      <PageHeader title="Bank Dashboard">
        <button className="btn" onClick={() => onSampleChange(!useSample)}>
          {useSample ? "✕ Stop using sample data" : "Use sample data"}
        </button>
      </PageHeader>

      {error && <div className="alert error">{error}</div>}

      <section className="panel" style={{ marginBottom: "1.5rem" }}>
        <h2 className="panel-title">Your transactions</h2>
        <label className="field">
          Choose your bank&apos;s CSV file
          <input type="file" accept=".csv,text/csv" onChange={onFileChange} />
        </label>
        <p className="muted" style={{ marginBottom: 0 }}>
          {useSample
            ? "Showing the built-in sample (fake) data."
            : info
              ? `Loaded ${info.rows} rows. Your file stays on this computer.`
              : "Your file stays on this computer and is never saved."}
        </p>
      </section>

      {!info && !error && (
        <section className="panel empty">
          <div className="empty-icon">
            <Icon name="upload" size={30} />
          </div>
          <h2>Nothing to show yet</h2>
          <p className="muted">
            Upload your bank&apos;s CSV above, or tap &quot;Use sample data&quot; to try it out.
          </p>
        </section>
      )}

      {info && sel && (
        <details
          className="panel settings"
          style={{ marginBottom: "1.5rem" }}
          open={settingsOpen}
          onToggle={(e) => setSettingsOpen(e.currentTarget.open)}
        >
          <summary>Match the columns</summary>
          <div className="stack" style={{ marginTop: "1rem" }}>
            <div className="row halves" style={{ marginBottom: 0 }}>
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
              <div className="row halves" style={{ marginBottom: 0 }}>
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
        </details>
      )}

      {analysis && (
        <>
          <label className="field" style={{ maxWidth: 260, marginBottom: "1rem" }}>
            Month
            <select value={month} onChange={(e) => setMonth(e.target.value)}>
              <option>{ALL_MONTHS}</option>
              {analysis.months.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </label>

          <div className="stats">
            <StatCard
              label="Total income"
              value={money(analysis.summary.income)}
              sub={month}
              icon="💵"
              tone="green"
            />
            <StatCard
              label="Total spending"
              value={money(analysis.summary.spending)}
              sub={`${analysis.transaction_count} transactions`}
              icon="💸"
              tone="yellow"
            />
            <StatCard
              label="Net (left over)"
              value={money(analysis.summary.net)}
              sub={analysis.summary.net >= 0 ? "Nice, you're in the green" : "Spending is above income"}
              icon="🏦"
              tone={analysis.summary.net >= 0 ? "blue" : "red"}
              bad={analysis.summary.net < 0}
            />
            <StatCard
              label="Top category"
              value={top ? top.category : "-"}
              sub={top ? `${money(top.amount)} (${top.percent.toFixed(0)}% of spending)` : "No spending yet"}
              icon="🏷️"
              tone="red"
            />
          </div>

          <div className="row main-side">
            <section className="panel">
              <h2 className="panel-title">Spending trend</h2>
              <div style={{ height: 260 }}>
                <ResponsiveContainer initialDimension={{ width: 320, height: 200 }}>
                  <LineChart data={analysis.by_month} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(v) => `$${v}`} width={64} />
                    <Tooltip formatter={(v) => money(Number(v))} />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      stroke={GREEN}
                      strokeWidth={4}
                      dot={{ r: 6, fill: GREEN }}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>

            {others.length > 0 ? (
              <section className="panel attention">
                <h2 className="panel-title">Needs a look</h2>
                <p style={{ marginTop: 0 }}>
                  {analysis.other_count} transaction{analysis.other_count === 1 ? " is" : "s are"}{" "}
                  in &quot;Other&quot; because no rule matched. Add keywords to RULES in
                  budget.py to sort them.
                </p>
                <div className="stack" style={{ gap: "0.4rem" }}>
                  {others.slice(0, 4).map((t, i) => (
                    <div key={i} className="muted">
                      {t.date} - {t.description} ({money(t.amount)})
                    </div>
                  ))}
                </div>
              </section>
            ) : (
              <section className="panel good">
                <h2 className="panel-title">All sorted</h2>
                <p style={{ margin: 0 }}>Every transaction matched a category.</p>
              </section>
            )}
          </div>

          <div className="row halves">
            <section className="panel">
              <h2 className="panel-title">Spending by category</h2>
              {analysis.by_category.length === 0 ? (
                <p className="muted">No spending in this period.</p>
              ) : (
                <div style={{ height: Math.max(180, analysis.by_category.length * 38 + 30) }}>
                  <ResponsiveContainer initialDimension={{ width: 320, height: 200 }}>
                    <BarChart data={analysis.by_category} layout="vertical" margin={{ left: 0, right: 16 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" tickFormatter={(v) => `$${v}`} />
                      <YAxis type="category" dataKey="category" width={104} />
                      <Tooltip formatter={(v) => money(Number(v))} />
                      <Bar
                        dataKey="amount"
                        fill={GREEN}
                        radius={[0, 8, 8, 0]}
                        isAnimationActive={false}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>

            <section className="panel">
              <h2 className="panel-title">Category breakdown</h2>
              <div className="table-wrap">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th className="num">Amount</th>
                      <th className="num">Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysis.by_category.map((c) => (
                      <tr key={c.category}>
                        <td>
                          <Pill category={c.category} />
                        </td>
                        <td className="num">{money(c.amount)}</td>
                        <td className="num">{c.percent.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <section className="panel">
            <h2 className="panel-title">Recent transactions</h2>
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
                      <td>
                        <Pill category={t.category} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {analysis.transaction_count > analysis.transactions.length && (
              <p className="muted" style={{ marginBottom: 0 }}>
                Showing the newest {analysis.transactions.length} of {analysis.transaction_count}{" "}
                transactions.
              </p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
