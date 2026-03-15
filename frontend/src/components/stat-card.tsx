import { Card } from "@/components/card";

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Card className="space-y-3">
      <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">{label}</div>
      <div className="text-3xl font-semibold tracking-tight text-[var(--text)]">{value}</div>
      <p className="text-sm text-[var(--muted)]">{hint}</p>
    </Card>
  );
}

