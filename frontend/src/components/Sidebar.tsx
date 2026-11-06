"use client";

import Disclaimer from "./Disclaimer";
import Icon from "./Icon";

export type View = "dashboard" | "planner";

const NAV: { view: View; icon: string; label: string }[] = [
  { view: "dashboard", icon: "📊", label: "Bank Dashboard" },
  { view: "planner", icon: "🎯", label: "Savings Planner" },
];

export default function Sidebar({
  view,
  onView,
}: {
  view: View;
  onView: (view: View) => void;
}) {
  function toggleTheme() {
    const root = document.documentElement;
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    if (next === "dark") root.dataset.theme = "dark";
    else delete root.dataset.theme;
    try {
      localStorage.setItem("hp-theme", next);
    } catch {
      // private mode: the choice just won't be remembered
    }
  }

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-logo" aria-hidden="true">
          <Icon name="logo" size={24} />
        </div>
        <div>
          <div className="brand-name">HealthyPockets</div>
          <div className="brand-sub">Personal finance</div>
        </div>
      </div>

      <nav className="nav" aria-label="Main">
        {NAV.map((item) => (
          <button
            key={item.view}
            className={`nav-item${view === item.view ? " active" : ""}`}
            aria-current={view === item.view ? "page" : undefined}
            onClick={() => onView(item.view)}
          >
            <Icon name={item.icon} size={18} />
            {item.label}
            <span className="chev" aria-hidden="true">
              ›
            </span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <Disclaimer />
        <button className="theme-toggle" onClick={toggleTheme}>
          <span className="when-light"><Icon name="moon" size={16} /> Dark mode</span>
          <span className="when-dark"><Icon name="sun" size={16} /> Light mode</span>
        </button>
      </div>
    </aside>
  );
}
