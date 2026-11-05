"use client";

import { useState } from "react";
import CsvMode from "@/components/CsvMode";
import Disclaimer from "@/components/Disclaimer";
import ManualMode from "@/components/ManualMode";

type Mode = "csv" | "manual";

export default function Home() {
  const [mode, setMode] = useState<Mode>("csv");

  return (
    <div className="app">
      <aside className="sidebar">
        <Disclaimer />
        <div className="radio-group" role="radiogroup" aria-label="How do you want to start?">
          <b>How do you want to start?</b>
          <label className="radio-row">
            <input
              type="radio"
              name="mode"
              checked={mode === "csv"}
              onChange={() => setMode("csv")}
            />
            Upload a bank CSV
          </label>
          <label className="radio-row">
            <input
              type="radio"
              name="mode"
              checked={mode === "manual"}
              onChange={() => setMode("manual")}
            />
            Enter numbers manually
          </label>
        </div>
      </aside>

      <main className="main">
        <h1 className="title">🥑 HealthyPockets</h1>
        <p className="caption">
          Runs only on this computer. Your file is never saved or uploaded anywhere.
        </p>
        {mode === "csv" ? <CsvMode /> : <ManualMode />}
      </main>
    </div>
  );
}
