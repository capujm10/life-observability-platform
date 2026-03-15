export function ChartEmptyState({
  title = "No data",
  description = "There is not enough data to render this chart yet.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="flex h-72 items-center justify-center rounded-[24px] border border-dashed border-[var(--border)] bg-[var(--panel-strong)] px-6 text-center">
      <div className="max-w-sm space-y-2">
        <div className="text-sm font-semibold text-[var(--text)]">{title}</div>
        <div className="text-sm leading-6 text-[var(--muted)]">{description}</div>
      </div>
    </div>
  );
}

