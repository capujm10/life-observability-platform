import { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-4 md:flex-row md:items-end md:justify-between", className)}>
      <div className="space-y-2">
        <div className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--muted)]">{eyebrow}</div>
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--text)]">{title}</h1>
        <p className="max-w-2xl text-sm leading-6 text-[var(--muted)]">{description}</p>
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </div>
  );
}

