const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function money(value: number): string {
  return usd.format(value);
}

/** Turn what someone typed into a safe, non-negative number. */
export function toNumber(text: string): number {
  const n = parseFloat(text);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

const PILL_TONES: Record<string, string> = {
  Income: "green",
  Groceries: "green",
  Housing: "blue",
  Transport: "blue",
  Utilities: "blue",
  Dining: "yellow",
  Shopping: "yellow",
  Subscriptions: "pink",
  "Personal Care": "pink",
  Other: "gray",
};

/** Which pill colour a category gets. */
export function pillTone(category: string): string {
  return PILL_TONES[category] ?? "gray";
}

export function todayLabel(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export const GREEN = "#2563eb";
export const DARK_GREEN = "#1e3a8a";
export const ORANGE = "#94a3b8";
export const YELLOW = "#38bdf8";
export const GOAL_COLORS = ["#2563eb", "#4f46e5", "#0ea5e9", "#1d4ed8", "#818cf8"];
