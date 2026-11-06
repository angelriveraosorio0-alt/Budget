// Small line icons (Feather-style paths). Callers pass the old emoji key so existing screens keep working.
const PATHS: Record<string, React.ReactNode> = {
  income: (
    <>
      <path d="M12 3v14" />
      <path d="M6 11l6 6 6-6" />
      <path d="M5 21h14" />
    </>
  ),
  spending: (
    <>
      <path d="M12 21V7" />
      <path d="M6 13l6-6 6 6" />
      <path d="M5 3h14" />
    </>
  ),
  bank: (
    <>
      <path d="M3 10l9-6 9 6" />
      <path d="M5 10v8M10 10v8M14 10v8M19 10v8" />
      <path d="M3 21h18" />
    </>
  ),
  tag: (
    <>
      <path d="M3 12V4h8l10 10-8 8L3 12z" />
      <circle cx="7.5" cy="8.5" r="1" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" />
    </>
  ),
  savings: (
    <>
      <path d="M12 3v18" />
      <path d="M16.5 7.5c-.6-1.3-2.2-2-4.5-2-2.6 0-4 1.1-4 2.7 0 4 9 1.8 9 6 0 1.7-1.7 2.8-4.5 2.8-2.4 0-4.2-.8-4.9-2.4" />
    </>
  ),
  check: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5l3 3 5-6" />
    </>
  ),
  alert: (
    <>
      <path d="M12 3l10 18H2L12 3z" />
      <path d="M12 10v5M12 18v.5" />
    </>
  ),
  chart: (
    <>
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </>
  ),
  logo: (
    <>
      <path d="M3 7a2 2 0 0 1 2-2h13v4" />
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M16 13.5h2" />
    </>
  ),
  moon: <path d="M20 14A8 8 0 0 1 10 4a8 8 0 1 0 10 10z" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  upload: (
    <>
      <path d="M12 16V4M7 9l5-5 5 5" />
      <path d="M4 20h16" />
    </>
  ),
};

const EMOJI: Record<string, string> = {
  "💵": "income",
  "💸": "spending",
  "🏦": "bank",
  "🏷️": "tag",
  "🎯": "target",
  "💚": "savings",
  "🎉": "check",
  "⚠️": "alert",
  "📊": "chart",
  "🥑": "logo",
};

export default function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const key = EMOJI[name] ?? name;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[key] ?? PATHS.chart}
    </svg>
  );
}
