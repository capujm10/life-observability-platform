import { ReactNode } from "react";

import { Card } from "@/components/card";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <Card className="border-dashed text-center">
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-8">
        <div className="rounded-full bg-[var(--soft)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
          Empty state
        </div>
        <h3 className="text-xl font-semibold text-[var(--text)]">{title}</h3>
        <p className="text-sm leading-6 text-[var(--muted)]">{description}</p>
        {action}
      </div>
    </Card>
  );
}

