export type ColumnInfo = {
  columns: string[];
  rows: number;
  date_col: string | null;
  desc_col: string | null;
  amount_col: string | null;
  debit_col: string | null;
  credit_col: string | null;
  mode: "one" | "split";
};

export type Analysis = {
  months: string[];
  summary: { income: number; spending: number; net: number };
  by_category: { category: string; amount: number; percent: number }[];
  by_month: { month: string; amount: number }[];
  transactions: { date: string; description: string; amount: number; category: string }[];
  transaction_count: number;
  other_count: number;
};

export type PlanGoal = {
  goal: string;
  target: number;
  saved_so_far: number;
  months: number;
  still_needed: number;
  save_per_month: number;
  progress: number;
};

export type Plan = {
  income: number;
  total_expenses: number;
  left_over: number;
  by_category: { category: string; amount: number }[];
  goals: PlanGoal[];
  needed_per_month: number;
  cushion: number;
  shortfall: number;
  status: "no_goals" | "done" | "on_track" | "short" | "no_money";
};

export type PlanRequest = {
  income: number;
  expenses: { category: string; amount: number }[];
  goals: { goal: string; target: number; saved_so_far: number; months: number }[];
};
