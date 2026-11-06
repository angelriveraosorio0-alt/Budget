"use client";

import { useState } from "react";
import CsvMode from "@/components/CsvMode";
import ManualMode from "@/components/ManualMode";
import Sidebar, { type View } from "@/components/Sidebar";

export default function Home() {
  const [view, setView] = useState<View>("dashboard");

  return (
    <div className="app">
      <Sidebar view={view} onView={setView} />
      <main className="main">
        {/* Both screens stay mounted so switching tabs doesn't lose your upload or your numbers. */}
        <div hidden={view !== "dashboard"}>
          <CsvMode />
        </div>
        <div hidden={view !== "planner"}>
          <ManualMode />
        </div>
      </main>
    </div>
  );
}
