"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { money } from "@/lib/format";

export type Slice = { name: string; value: number; color: string };

export default function DonutChart({ slices }: { slices: Slice[] }) {
  const data = slices.filter((s) => s.value > 0);
  if (data.length === 0) {
    return <p className="muted">Enter income, expenses or goals to see the chart.</p>;
  }
  return (
    <div>
      <div style={{ width: "100%", height: 260 }}>
        <ResponsiveContainer initialDimension={{ width: 320, height: 200 }}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="55%"
              outerRadius="95%"
              isAnimationActive={false}
            >
              {data.map((s) => (
                <Cell key={s.name} fill={s.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => money(Number(value))} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="legend">
        {data.map((s) => (
          <div key={s.name}>
            <span className="dot" style={{ background: s.color }} />
            {s.name} - {money(s.value)}
          </div>
        ))}
      </div>
    </div>
  );
}
