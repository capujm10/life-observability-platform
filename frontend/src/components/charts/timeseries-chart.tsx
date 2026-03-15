"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartEmptyState } from "@/components/charts/chart-empty-state";

type Datum = {
  date: string;
  label: string;
  value: number;
};

export function TimeSeriesChart({
  data,
  color,
  valueLabel,
  height = 280,
}: {
  data: Datum[];
  color: string;
  valueLabel: string;
  height?: number;
}) {
  if (!data.length) {
    return <ChartEmptyState />;
  }

  return (
    <div className="h-[280px] w-full" style={{ height }}>
      <ResponsiveContainer height="100%" width="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: -20 }}>
          <defs>
            <linearGradient id={`fill-${color.replace(/[^a-zA-Z0-9]/g, "")}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.32} />
              <stop offset="95%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            axisLine={false}
            dataKey="label"
            tick={{ fill: "var(--muted)", fontSize: 12 }}
            tickLine={false}
          />
          <YAxis
            axisLine={false}
            allowDecimals={false}
            tick={{ fill: "var(--muted)", fontSize: 12 }}
            tickLine={false}
            width={36}
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
            labelFormatter={(_, payload) => payload?.[0]?.payload?.date ?? ""}
          />
          <Area
            dataKey="value"
            fill={`url(#fill-${color.replace(/[^a-zA-Z0-9]/g, "")})`}
            fillOpacity={1}
            stroke={color}
            strokeWidth={3}
            type="monotone"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
