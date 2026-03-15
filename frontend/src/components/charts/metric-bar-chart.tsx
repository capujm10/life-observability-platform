"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { ChartEmptyState } from "@/components/charts/chart-empty-state";

type BarDatum = {
  label: string;
  value: number;
  color?: string;
  [key: string]: string | number | undefined;
};

export function MetricBarChart({
  data,
  valueLabel,
  height = 280,
}: {
  data: BarDatum[];
  valueLabel: string;
  height?: number;
}) {
  if (!data.length) {
    return <ChartEmptyState />;
  }

  return (
    <div className="h-[280px] w-full" style={{ height }}>
      <ResponsiveContainer height="100%" width="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: -20 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            axisLine={false}
            dataKey="label"
            tick={{ fill: "var(--muted)", fontSize: 12 }}
            tickLine={false}
          />
          <YAxis
            axisLine={false}
            tick={{ fill: "var(--muted)", fontSize: 12 }}
            tickLine={false}
            width={42}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 18,
              border: "1px solid var(--border)",
              background: "var(--panel-strong)",
              color: "var(--text)",
              boxShadow: "0 18px 50px rgba(15,23,42,0.08)",
            }}
            formatter={(value) => [`${Number(value ?? 0)} ${valueLabel}`, valueLabel]}
          />
          <Bar dataKey="value" radius={[12, 12, 4, 4]}>
            {data.map((entry) => (
              <Cell key={entry.label} fill={entry.color ?? "var(--accent)"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
