export function LoadingPanel({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="rounded-[28px] border border-[var(--border)] bg-[var(--panel)] p-10 text-center text-sm text-[var(--muted)]">
      {label}
    </div>
  );
}

