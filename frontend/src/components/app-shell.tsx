"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Badge } from "@/components/badge";
import { Button } from "@/components/button";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { cn, formatLongDate } from "@/lib/utils";

const navigation = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/tasks", label: "Tasks" },
  { href: "/habits", label: "Habits" },
  { href: "/journal", label: "Journal" },
  { href: "/projects", label: "Projects" },
  { href: "/metrics", label: "Metrics" },
  { href: "/weekly-summary", label: "Weekly Summary" },
  { href: "/settings", label: "Settings" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { logout, user } = useAuth();
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="mx-auto flex min-h-screen max-w-[1600px] flex-col gap-6 px-4 py-4 lg:flex-row lg:px-6">
        <aside className="hidden w-80 shrink-0 rounded-[32px] border border-[var(--border)] bg-[var(--sidebar)] p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] lg:flex lg:flex-col">
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--muted)]">
                  Life Observability Platform
                </div>
                <div className="mt-2 text-2xl font-semibold tracking-tight text-[var(--text)]">
                  Observe your life like a system.
                </div>
              </div>
              <Badge tone="info">MVP</Badge>
            </div>
            <p className="text-sm leading-6 text-[var(--muted)]">
              A focused command center for tasks, habits, journal signals, projects, and weekly feedback loops.
            </p>
          </div>

          <nav className="mt-8 flex flex-1 flex-col gap-2">
            {navigation.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-2xl px-4 py-3 text-sm font-medium transition",
                    active
                      ? "bg-[var(--panel-strong)] text-[var(--text)] shadow-[0_14px_40px_rgba(15,23,42,0.08)]"
                      : "text-[var(--muted)] hover:bg-[var(--panel)] hover:text-[var(--text)]",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="space-y-4 rounded-[28px] border border-[var(--border)] bg-[var(--panel)] p-5">
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">Current mode</div>
            <div className="text-lg font-semibold text-[var(--text)]">Operate with signal, not noise.</div>
            <div className="text-sm leading-6 text-[var(--muted)]">{formatLongDate(new Date().toISOString())}</div>
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col gap-6">
          <div className="rounded-[28px] border border-[var(--border)] bg-[var(--panel)] p-4 backdrop-blur">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
                  Operator
                </div>
                <div className="mt-1 text-xl font-semibold text-[var(--text)]">
                  {user?.full_name ?? "Demo Operator"}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="flex rounded-2xl border border-[var(--border)] bg-[var(--panel-strong)] p-1">
                  {(["light", "dark", "system"] as const).map((option) => (
                    <button
                      key={option}
                      className={cn(
                        "rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em]",
                        theme === option ? "bg-[var(--soft)] text-[var(--text)]" : "text-[var(--muted)]",
                      )}
                      onClick={() => setTheme(option)}
                      type="button"
                    >
                      {option}
                    </button>
                  ))}
                </div>
                <Button variant="secondary" onClick={logout}>
                  Log out
                </Button>
              </div>
            </div>
            <div className="mt-4 flex gap-2 overflow-x-auto lg:hidden">
              {navigation.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium",
                      active ? "bg-[var(--accent)] text-white" : "bg-[var(--panel-strong)] text-[var(--muted)]",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <main className="pb-10">{children}</main>
        </div>
      </div>
    </div>
  );
}
