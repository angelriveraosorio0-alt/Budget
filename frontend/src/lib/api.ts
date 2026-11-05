import type { Analysis, ColumnInfo, Plan, PlanRequest } from "./types";

// The Python backend. Override with NEXT_PUBLIC_API_URL if you run it somewhere else.
const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(BASE + path, init);
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    throw new Error("Can't reach the HealthyPockets server. Is the backend running?");
  }
  if (!res.ok) {
    let message = `Something went wrong (${res.status}).`;
    try {
      const body = await res.json();
      if (typeof body.detail === "string") message = body.detail;
    } catch {
      // keep the generic message
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export function getMeta(): Promise<{ expense_categories: string[] }> {
  return request("/api/meta");
}

function withSource(form: FormData, file: File | null, useSample: boolean) {
  if (useSample) form.append("use_sample", "true");
  else if (file) form.append("file", file);
}

export function fetchColumns(file: File | null, useSample: boolean): Promise<ColumnInfo> {
  const form = new FormData();
  withSource(form, file, useSample);
  return request("/api/columns", { method: "POST", body: form });
}

export type AnalyzeParams = {
  file: File | null;
  useSample: boolean;
  dateCol: string;
  descCol: string;
  mode: "one" | "split";
  amountCol: string;
  debitCol: string;
  creditCol: string;
  spendingIsPositive: boolean;
  month: string;
};

export function analyze(p: AnalyzeParams, signal?: AbortSignal): Promise<Analysis> {
  const form = new FormData();
  withSource(form, p.file, p.useSample);
  form.append("date_col", p.dateCol);
  form.append("desc_col", p.descCol);
  form.append("mode", p.mode);
  if (p.mode === "one") {
    form.append("amount_col", p.amountCol);
    form.append("spending_is_positive", String(p.spendingIsPositive));
  } else {
    form.append("debit_col", p.debitCol);
    form.append("credit_col", p.creditCol);
  }
  form.append("month", p.month);
  return request("/api/analyze", { method: "POST", body: form, signal });
}

export function fetchPlan(body: PlanRequest, signal?: AbortSignal): Promise<Plan> {
  return request("/api/plan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
}
