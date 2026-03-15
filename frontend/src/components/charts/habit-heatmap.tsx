import { ChartEmptyState } from "@/components/charts/chart-empty-state";
import { HabitHeatmapRow } from "@/lib/types";

export function HabitHeatmap({ rows }: { rows: HabitHeatmapRow[] }) {
  if (!rows.length) {
    return <ChartEmptyState title="No habit activity" description="Log habits to build a consistency heatmap." />;
  }

  const labels = rows[0]?.cells.map((cell) => cell.label) ?? [];

  return (
    <div className="space-y-4 overflow-x-auto">
      <div
        className="grid min-w-[760px] gap-2"
        style={{ gridTemplateColumns: `180px repeat(${labels.length}, minmax(0, 1fr))` }}
      >
        <div />
        {labels.map((label, index) => (
          <div key={`${label}-${index}`} className="px-1 text-center text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--muted)]">
            {label}
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {rows.map((row) => (
          <div
            key={row.habit_id}
            className="grid min-w-[760px] items-center gap-2"
            style={{ gridTemplateColumns: `180px repeat(${row.cells.length}, minmax(0, 1fr))` }}
          >
            <div className="pr-3">
              <div className="text-sm font-semibold text-[var(--text)]">{row.habit_name}</div>
            </div>
            {row.cells.map((cell) => (
              <div
                key={cell.date}
                className="aspect-square rounded-xl border border-[var(--border)]"
                style={{
                  backgroundColor: row.color,
                  opacity: cell.intensity,
                }}
                title={`${row.habit_name} · ${cell.date} · ${cell.completed ? "Completed" : "Not completed"}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
