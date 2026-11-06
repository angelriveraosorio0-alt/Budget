import Icon from "./Icon";

export type Tone = "green" | "yellow" | "blue" | "red";

export default function StatCard({
  label,
  value,
  sub,
  icon,
  tone = "green",
  bad = false,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: string;
  tone?: Tone;
  bad?: boolean;
}) {
  return (
    <div className={`stat${bad ? " bad" : ""}`}>
      <div className="stat-top">
        <span className="stat-label">{label}</span>
        <span className={`stat-chip chip-${tone}`} aria-hidden="true">
          <Icon name={icon} size={20} />
        </span>
      </div>
      <div className="stat-value">{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}
