import { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

export function Button({
  className,
  variant = "primary",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-2xl px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
        variant === "primary" &&
          "bg-[var(--accent)] text-white shadow-[0_12px_30px_rgba(15,118,110,0.25)] hover:bg-[var(--accent-strong)]",
        variant === "secondary" &&
          "border border-[var(--border)] bg-[var(--panel-strong)] text-[var(--text)] hover:bg-[var(--panel)]",
        variant === "ghost" && "text-[var(--muted)] hover:bg-[var(--panel)] hover:text-[var(--text)]",
        variant === "danger" && "bg-[var(--danger)] text-white hover:bg-[var(--danger-strong)]",
        className,
      )}
      type={type}
      {...props}
    />
  );
}

