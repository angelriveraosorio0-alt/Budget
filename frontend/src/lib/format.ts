const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function money(value: number): string {
  return usd.format(value);
}

/** Turn what someone typed into a safe, non-negative number. */
export function toNumber(text: string): number {
  const n = parseFloat(text);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export const GREEN = "#22c55e";
export const DARK_GREEN = "#14532d";
export const ORANGE = "#fb923c";
export const YELLOW = "#facc15";
export const GOAL_COLORS = ["#22c55e", "#16a34a", "#4ade80", "#15803d", "#86efac"];
