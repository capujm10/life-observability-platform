"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { api, ApiError } from "@/lib/api";
import { DashboardOverview } from "@/lib/types";
import { formatDate, formatMinutes, priorityTone, projectStatusLabel, statusTone, taskStatusLabel, toPercent } from "@/lib/utils";
import { Badge } from "@/components/badge";
import { Card } from "@/components/card";
import { EmptyState } from "@/components/empty-state";
import { LoadingPanel } from "@/components/loading-panel";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { useAuth } from "@/hooks/use-auth";

export default function DashboardPage() {
  const { token } = useAuth();
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadOverview = useCallback(async () => {
    if (!token) {
      return;
    }

    setLoading(true);
    try {
      setOverview(await api.getDashboard(token));
      setError("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to load dashboard.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  if (loading) {
    return <LoadingPanel label="Loading dashboard..." />;
  }

  if (error) {
    return <EmptyState description={error} title="Dashboard unavailable" />;
  }

  if (!overview) {
    return <EmptyState description="No dashboard data was returned." title="No data yet" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <>
            <Link
              className="inline-flex items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--panel-strong)] px-4 py-2 text-sm font-semibold text-[var(--text)] transition hover:bg-[var(--panel)]"
              href="/tasks"
            >
              Review tasks
            </Link>
            <Link
              className="inline-flex items-center justify-center rounded-2xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(15,118,110,0.25)] transition hover:bg-[var(--accent-strong)]"
              href="/weekly-summary"
            >
              Weekly pulse
            </Link>
          </>
        }
        description="An observability surface for execution, reflection, delivery, and long-range progress."
        eyebrow="Overview"
        title={`Welcome back, ${overview.user.full_name.split(" ")[0]}`}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatCard
          hint="Items not yet closed."
          label="Open tasks"
          value={String(overview.stats.open_tasks)}
        />
        <StatCard
          hint="Completed over the last seven days."
          label="Tasks done"
          value={String(overview.stats.completed_tasks_week)}
        />
        <StatCard
          hint="Average completion against active targets."
          label="Habit consistency"
          value={toPercent(overview.stats.habit_completion_rate)}
        />
        <StatCard
          hint="Reflective entries logged this week."
          label="Journal cadence"
          value={String(overview.stats.journal_entries_week)}
        />
        <StatCard
          hint="Projects in motion or flagged."
          label="Active projects"
          value={String(overview.stats.active_projects)}
        />
        <StatCard
          hint="Tracked from daily metrics snapshots."
          label="Focus time"
          value={formatMinutes(overview.stats.focus_minutes_week)}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">Next actions</div>
              <div className="mt-2 text-xl font-semibold text-[var(--text)]">Upcoming tasks</div>
            </div>
            <Link className="text-sm font-semibold text-[var(--accent)]" href="/tasks">
              Open tasks page
            </Link>
          </div>
          <div className="space-y-3">
            {overview.upcoming_tasks.length ? (
              overview.upcoming_tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex flex-col gap-3 rounded-[24px] border border-[var(--border)] bg-[var(--panel-strong)] p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="space-y-2">
                    <div className="text-base font-semibold text-[var(--text)]">{task.title}</div>
                    <div className="flex flex-wrap gap-2">
                      <Badge tone={priorityTone(task.priority)}>{task.priority}</Badge>
                      <Badge tone={statusTone(task.status)}>{taskStatusLabel(task.status)}</Badge>
                    </div>
                  </div>
                  <div className="text-sm text-[var(--muted)]">{formatDate(task.due_date)}</div>
                </div>
              ))
            ) : (
              <EmptyState
                description="Your task queue is clear. Add the next high-leverage item."
                title="No open tasks"
              />
            )}
          </div>
        </Card>

        <Card className="space-y-5">
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">Journal prompt</div>
          <div className="text-2xl font-semibold leading-tight text-[var(--text)]">{overview.journal_prompt}</div>
          <p className="text-sm leading-6 text-[var(--muted)]">
            Use the journal page to capture signal, not volume. One clear reflection is enough.
          </p>
          <Link
            className="inline-flex items-center justify-center rounded-2xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(15,118,110,0.25)] transition hover:bg-[var(--accent-strong)]"
            href="/journal"
          >
            Open journal
          </Link>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="space-y-5">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">Habit rhythm</div>
            <div className="mt-2 text-xl font-semibold text-[var(--text)]">Today&apos;s habit check</div>
          </div>
          <div className="space-y-3">
            {overview.todays_habits.map((habit) => (
              <div
                key={habit.id}
                className="flex items-center justify-between rounded-[24px] border border-[var(--border)] bg-[var(--panel-strong)] p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: habit.color }} />
                  <div>
                    <div className="font-semibold text-[var(--text)]">{habit.name}</div>
                    <div className="text-sm text-[var(--muted)]">{habit.current_streak}-day streak</div>
                  </div>
                </div>
                <Badge tone={habit.completed_today ? "success" : "neutral"}>
                  {habit.completed_today ? "Done today" : `${habit.target_days_per_week}/week target`}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card className="space-y-5">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">Project health</div>
            <div className="mt-2 text-xl font-semibold text-[var(--text)]">Active initiatives</div>
          </div>
          <div className="space-y-4">
            {overview.active_projects.map((project) => (
              <div key={project.id} className="rounded-[24px] border border-[var(--border)] bg-[var(--panel-strong)] p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-semibold text-[var(--text)]">{project.name}</div>
                    <div className="mt-2 text-sm text-[var(--muted)]">
                      Target date: {formatDate(project.target_date)}
                    </div>
                  </div>
                  <Badge tone={statusTone(project.status)}>{projectStatusLabel(project.status)}</Badge>
                </div>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-[var(--soft)]">
                  <div
                    className="h-full rounded-full bg-[var(--accent)]"
                    style={{ width: `${project.progress_percentage}%` }}
                  />
                </div>
                <div className="mt-2 text-sm text-[var(--muted)]">{project.progress_percentage}% complete</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
