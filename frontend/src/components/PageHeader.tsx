"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { todayLabel } from "@/lib/format";

const noSubscription = () => () => {};

export default function PageHeader({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  // The date depends on the viewer's clock, so it's read in the browser only
  // (the server renders an empty string, and the real date appears right after).
  const today = useSyncExternalStore(noSubscription, todayLabel, () => "");

  return (
    <header className="page-header">
      <div>
        <h1 className="page-title">{title}</h1>
        <div className="page-sub">{today || " "}</div>
      </div>
      {children && <div className="header-actions">{children}</div>}
    </header>
  );
}
