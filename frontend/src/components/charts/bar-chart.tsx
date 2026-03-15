import { TimeSeriesPoint } from "@/lib/types";

export function BarChart({ data, color = "#0f766e" }: { data: TimeSeriesPoint[]; color?: string }) {
  if (!data.length) {
    return <div className="text-sm text-[var(--muted)]">No chart data.</div>;
  }

  const max = Math.max(...data.map((point) => point.value), 1);

  return (
    <div className="flex h-52 items-end gap-3">
      {data.map((point) => (
        <div key={point.date} className="flex flex-1 flex-col items-center gap-2">
          <div
            className="w-full rounded-t-2xl"
            style={{
              height: `${Math.max((point.value / max) * 100, point.value ? 10 : 0)}%`,
              background: `linear-gradient(180deg, ${color}, color-mix(in srgb, ${color} 30%, transparent))`,
            }}
          />
          <div className="text-xs text-[var(--muted)]">{point.label}</div>
        </div>
      ))}
    </div>
  );
}

