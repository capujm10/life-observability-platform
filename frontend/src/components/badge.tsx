import { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "info" | "success" | "warning" | "danger";
};

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize",
        tone === "neutral" && "bg-[var(--soft)] text-[var(--muted)]",
        tone === "info" && "bg-[var(--accent-soft)] text-[var(--accent)]",
        tone === "success" && "bg-[var(--success-soft)] text-[var(--success)]",
        tone === "warning" && "bg-[var(--warning-soft)] text-[var(--warning)]",
        tone === "danger" && "bg-[var(--danger-soft)] text-[var(--danger)]",
        className,
      )}
      {...props}
    />
  );
}

