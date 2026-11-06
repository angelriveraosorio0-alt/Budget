"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fetchPlan, getMeta } from "@/lib/api";
import { GOAL_COLORS, GREEN, ORANGE, YELLOW, money, toNumber } from "@/lib/format";
import type { Plan, PlanRequest } from "@/lib/types";
import DonutChart, { type Slice } from "./DonutChart";
import PageHeader from "./PageHeader";
import StatCard from "./StatCard";

const FALLBACK_CATEGORIES = [
  "Housing",
  "Groceries",
  "Dining",
  "Transport",
  "Utilities",
  "Subscriptions",
  "Shopping",
  "Personal Care",
  "Other",
];

type ExpenseRow = { id: number; category: string; amount: string };
type GoalRow = { id: number; goal: string; target: string; saved: string; months: string };

const defaultExpenses = (): ExpenseRow[] => [
  { id: 1, category: "Housing", amount: "" },
  { id: 2, category: "Groceries", amount: "" },
  { id: 3, category: "Transport", amount: "" },
];
const defaultGoals = (): GoalRow[] => [
  { id: 1, goal: "Emergency fund", target: "1000", saved: "", months: "12" },
];

export default function ManualMode() {
  const nextId = useRef(100);
  const [income, setIncome] = useState("");
  const [categories, setCategories] = useState(FALLBACK_CATEGORIES);
  const [expenses, setExpenses] = useState<ExpenseRow[]>(defaultExpenses);
  const [goals, setGoals] = useState<GoalRow[]>(defaultGoals);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMeta()
      .then((m) => setCategories(m.expense_categories))
      .catch(() => {
        // the built-in list is fine if the server can't be reached yet
      });
  }, []);

  // Ask the Python backend for the numbers whenever something changes.
  useEffect(() => {
    const controller = new AbortController();
    const body: PlanRequest = {
      income: toNumber(income),
      expenses: expenses.map((e) => ({ category: e.category, amount: toNumber(e.amount) })),
      goals: goals
        .filter((g) => g.goal.trim() !== "")
        .map((g) => ({
          goal: g.goal.trim(),
          target: toNumber(g.target),
          saved_so_far: toNumber(g.saved),
          months: Math.min(1200, Math.max(1, Math.round(toNumber(g.months)) || 1)),
        })),
    };
    const timer = setTimeout(() => {
      fetchPlan(body, controller.signal)
        .then((p) => {
          setPlan(p);
          setError(null);
        })
        .catch((err: Error) => {
          if (err.name !== "AbortError") setError(err.message);
        });
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [income, expenses, goals]);

  const patchExpense = (id: number, patch: Partial<ExpenseRow>) =>
    setExpenses((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const patchGoal = (id: number, patch: Partial<GoalRow>) =>
    setGoals((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const addExpense = () =>
    setExpenses((rows) => [...rows, { id: nextId.current++, category: "Other", amount: "" }]);
  const addGoal = () =>
    setGoals((rows) => [
      ...rows,
      { id: nextId.current++, goal: "", target: "", saved: "", months: "12" },
    ]);
  const resetAll = () => {
    setIncome("");
    setExpenses(defaultExpenses());
    setGoals(defaultGoals());
  };

  const slices: Slice[] = plan
    ? [
        { name: "Expenses", value: plan.total_expenses, color: ORANGE },
        ...plan.goals.map((g, i) => ({
          name: `Goal: ${g.goal}`,
          value: g.save_per_month,
          color: GOAL_COLORS[i % GOAL_COLORS.length],
        })),
        { name: "Free to spend", value: Math.max(plan.cushion, 0), color: YELLOW },
      ]
    : [];

  return (
    <div>
      <PageHeader title="Savings Planner">
        <button className="btn ghost" onClick={resetAll}>
          Start over
        </button>
      </PageHeader>

      {error && <div className="alert error">{error}</div>}

      <div className="stats">
        <StatCard
          label="Monthly income"
          value={money(plan?.income ?? 0)}
          sub="after tax"
          icon="💵"
          tone="green"
        />
        <StatCard
          label="Monthly expenses"
          value={money(plan?.total_expenses ?? 0)}
          sub={`${plan?.by_category.length ?? 0} categories`}
          icon="💸"
          tone="yellow"
        />
        <StatCard
          label="Left over"
          value={money(plan?.left_over ?? 0)}
          sub="each month"
          icon="🏦"
          tone={(plan?.left_over ?? 0) < 0 ? "red" : "blue"}
          bad={(plan?.left_over ?? 0) < 0}
        />
        <StatCard
          label="Save for goals"
          value={money(plan?.needed_per_month ?? 0)}
          sub={`${plan?.goals.length ?? 0} goal${plan?.goals.length === 1 ? "" : "s"}`}
          icon="🎯"
          tone="red"
        />
      </div>

      <div className="row halves">
        <section className="panel">
          <h2 className="panel-title">Income &amp; expenses</h2>
          <label className="field" style={{ marginBottom: "1rem" }}>
            Monthly income ($, after tax)
            <input
              type="number"
              min={0}
              step={50}
              inputMode="decimal"
              placeholder="0.00"
              value={income}
              onChange={(e) => setIncome(e.target.value)}
            />
          </label>
          <div className="table-wrap" style={{ border: "3px solid var(--outline)", borderRadius: 14 }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Category</th>
                  <th className="num">Per month</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {expenses.map((row) => (
                  <tr key={row.id}>
                    <td className="input-cell">
                      <select
                        aria-label="Expense category"
                        value={row.category}
                        onChange={(e) => patchExpense(row.id, { category: e.target.value })}
                      >
                        {categories.map((c) => (
                          <option key={c}>{c}</option>
                        ))}
                      </select>
                    </td>
                    <td className="input-cell">
                      <input
                        type="number"
                        min={0}
                        step={10}
                        inputMode="decimal"
                        aria-label="Expense amount per month"
                        placeholder="0.00"
                        value={row.amount}
                        onChange={(e) => patchExpense(row.id, { amount: e.target.value })}
                      />
                    </td>
                    <td className="input-cell">
                      <button
                        className="btn small ghost"
                        aria-label="Remove this expense"
                        onClick={() => setExpenses((rows) => rows.filter((r) => r.id !== row.id))}
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ marginBottom: 0 }}>
            <button className="btn" onClick={addExpense}>
              + Add expense
            </button>
          </p>
        </section>

        <section className="panel">
          <h2 className="panel-title">Expenses by category</h2>
          {plan && plan.by_category.length > 0 ? (
            <div style={{ height: Math.max(200, plan.by_category.length * 38 + 30) }}>
              <ResponsiveContainer initialDimension={{ width: 320, height: 200 }}>
                <BarChart data={plan.by_category} layout="vertical" margin={{ left: 0, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickFormatter={(v) => `$${v}`} />
                  <YAxis type="category" dataKey="category" width={104} />
                  <Tooltip formatter={(v) => money(Number(v))} />
                  <Bar dataKey="amount" fill={GREEN} radius={[0, 8, 8, 0]} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="muted">Add an amount to an expense and its bar shows up here.</p>
          )}
        </section>
      </div>

      <section className="panel" style={{ marginBottom: "1.5rem" }}>
        <h2 className="panel-title">Savings goals</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          How much you want, how much you already have, and how many months you want to take.
        </p>
        <div className="table-wrap" style={{ border: "3px solid var(--outline)", borderRadius: 14 }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Goal</th>
                <th className="num">Target amount</th>
                <th className="num">Saved so far</th>
                <th className="num">Months to reach it</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {goals.map((row) => (
                <tr key={row.id}>
                  <td className="input-cell">
                    <input
                      type="text"
                      aria-label="Goal name"
                      maxLength={80}
                      placeholder="e.g. Vacation"
                      value={row.goal}
                      onChange={(e) => patchGoal(row.id, { goal: e.target.value })}
                    />
                  </td>
                  <td className="input-cell">
                    <input
                      type="number"
                      min={0}
                      aria-label="Goal target amount"
                      placeholder="0.00"
                      value={row.target}
                      onChange={(e) => patchGoal(row.id, { target: e.target.value })}
                    />
                  </td>
                  <td className="input-cell">
                    <input
                      type="number"
                      min={0}
                      aria-label="Amount saved so far"
                      placeholder="0.00"
                      value={row.saved}
                      onChange={(e) => patchGoal(row.id, { saved: e.target.value })}
                    />
                  </td>
                  <td className="input-cell">
                    <input
                      type="number"
                      min={1}
                      step={1}
                      aria-label="Months to reach the goal"
                      value={row.months}
                      onChange={(e) => patchGoal(row.id, { months: e.target.value })}
                    />
                  </td>
                  <td className="input-cell">
                    <button
                      className="btn small ghost"
                      aria-label="Remove this goal"
                      onClick={() => setGoals((rows) => rows.filter((r) => r.id !== row.id))}
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ marginBottom: 0 }}>
          <button className="btn" onClick={addGoal}>
            + Add goal
          </button>
        </p>
      </section>

      {plan && plan.goals.length === 0 && (
        <div className="alert info">Add a goal above to see how much to save each month.</div>
      )}

      {plan && plan.goals.length > 0 && (
        <>
          <h2 style={{ fontSize: "1.4rem" }}>Your savings plan</h2>
          <div className="stats">
            <StatCard
              label="Save each month"
              value={money(plan.needed_per_month)}
              sub="to hit every goal"
              icon="💚"
              tone="green"
            />
            <StatCard
              label="Left after expenses"
              value={money(plan.left_over)}
              sub="available to save"
              icon="🏦"
              tone="blue"
              bad={plan.left_over < 0}
            />
            <StatCard
              label={plan.cushion >= 0 ? "Extra cushion" : "Short by"}
              value={money(Math.abs(plan.cushion))}
              sub={plan.cushion >= 0 ? "free to spend" : "per month"}
              icon={plan.cushion >= 0 ? "🎉" : "⚠️"}
              tone={plan.cushion >= 0 ? "yellow" : "red"}
              bad={plan.cushion < 0}
            />
          </div>

          <div className="row main-side">
            <div className="stack">
              {plan.goals.map((g, i) => (
                <div className="card" key={i}>
                  <b>{g.goal}</b>
                  <div className="big-number">{money(g.save_per_month)} / month</div>
                  <div
                    className="progress"
                    role="progressbar"
                    aria-label={`${g.goal} progress`}
                    aria-valuenow={Math.round(g.progress * 100)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div style={{ width: `${g.progress * 100}%` }} />
                  </div>
                  <span className="muted">
                    {money(g.saved_so_far)} saved of {money(g.target)} - {g.months} months to go
                  </span>
                </div>
              ))}
            </div>
            <section className="panel">
              <h2 className="panel-title">Where your monthly money goes</h2>
              <DonutChart slices={slices} />
              {plan.cushion < 0 && (
                <p className="muted">Expenses plus goals add up to more than your income.</p>
              )}
            </section>
          </div>

          {plan.status === "done" && (
            <div className="alert ok">You&apos;ve already reached every goal listed.</div>
          )}
          {plan.status === "on_track" && (
            <div className="alert ok">
              You&apos;re on track. After expenses you have {money(plan.left_over)} left, which
              covers the {money(plan.needed_per_month)} you need.
            </div>
          )}
          {plan.status === "short" && (
            <div className="alert warn">
              You&apos;re {money(plan.shortfall)} per month short. Try giving yourself more months,
              or trimming an expense category.
            </div>
          )}
          {plan.status === "no_money" && (
            <div className="alert error">
              Your expenses are at or above your income, so there&apos;s nothing left to save yet.
              Lowering a category above is the quickest fix.
            </div>
          )}
        </>
      )}
    </div>
  );
}
