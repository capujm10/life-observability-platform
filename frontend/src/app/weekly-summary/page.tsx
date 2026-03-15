"use client";

import { useCallback, useEffect, useState } from "react";

import { api, ApiError } from "@/lib/api";
import { WeeklySummary } from "@/lib/types";
import { formatLongDate, formatMinutes, projectStatusLabel, statusTone, toPercent } from "@/lib/utils";
import { Badge } from "@/components/badge";
import { Card } from "@/components/card";
import { EmptyState } from "@/components/empty-state";
import { LoadingPanel } from "@/components/loading-panel";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { LineChart } from "@/components/charts/line-chart";
import { useAuth } from "@/hooks/use-auth";

export default function WeeklySummaryPage() {
  const { token } = useAuth();
  const [summary, setSummary] = useState<WeeklySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSummary = useCallback(async () => {
    if (!token) {
      return;
    }

    setLoading(true);
    try {
      setSummary(await api.getWeeklySummary(token));
      setError("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to load weekly summary.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  if (loading) {
    return <LoadingPanel label="Computing weekly summary..." />;
  }

  if (error) {
    return <EmptyState description={error} title="Weekly summary unavailable" />;
  }

  if (!summary) {
    return <EmptyState description="No summary data was returned." title="No summary yet" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        description={`${formatLongDate(summary.period_start)} to ${formatLongDate(summary.period_end)}`}
        eyebrow="Weekly review"
        title="Weekly Summary"
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard hint="Closed during the review window." label="Completed tasks" value={String(summary.completed_tasks)} />
        <StatCard hint="Added during the review window." label="Tasks created" value={String(summary.tasks_created)} />
        <StatCard hint="From daily focus tracking." label="Focus time" value={formatMinutes(summary.focus_minutes)} />
        <StatCard hint="Average across tracked habits." label="Habit completion" value={toPercent(summary.habit_completion_rate)} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="space-y-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">Focus rhythm</div>
            <div className="mt-2 text-xl font-semibold text-[var(--text)]">Daily focus over the week</div>
          </div>
          <LineChart data={summary.daily_focus} />
        </Card>

        <Card className="space-y-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">Habit leaders</div>
            <div className="mt-2 text-xl font-semibold text-[var(--text)]">Best performing habits</div>
          </div>
          <div className="space-y-3">
            {summary.habit_highlights.map((habit) => (
              <div key={habit.habit_id} className="rounded-[24px] border border-[var(--border)] bg-[var(--panel-strong)] p-4">
                <div className="font-semibold text-[var(--text)]">{habit.habit_name}</div>
                <div className="mt-1 text-sm text-[var(--muted)]">
                  {toPercent(habit.completion_rate)} consistency · {habit.current_streak}-day streak
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="space-y-4">
          <div className="text-xl font-semibold text-[var(--text)]">Wins</div>
          <ul className="space-y-3 text-sm leading-6 text-[var(--muted)]">
            {summary.wins.map((item) => (
              <li key={item} className="rounded-[20px] bg-[var(--panel-strong)] px-4 py-3">
                {item}
              </li>
            ))}
          </ul>
        </Card>

        <Card className="space-y-4">
          <div className="text-xl font-semibold text-[var(--text)]">Risks</div>
          <ul className="space-y-3 text-sm leading-6 text-[var(--muted)]">
            {summary.risks.map((item) => (
              <li key={item} className="rounded-[20px] bg-[var(--panel-strong)] px-4 py-3">
                {item}
              </li>
            ))}
          </ul>
        </Card>

        <Card className="space-y-4">
          <div className="text-xl font-semibold text-[var(--text)]">Next focus</div>
          <ul className="space-y-3 text-sm leading-6 text-[var(--muted)]">
            {summary.next_focus.map((item) => (
              <li key={item} className="rounded-[20px] bg-[var(--panel-strong)] px-4 py-3">
                {item}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="space-y-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">Project movement</div>
          <div className="mt-2 text-xl font-semibold text-[var(--text)]">Changes across initiatives</div>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {summary.project_movements.map((project) => (
            <div key={project.project_id} className="rounded-[24px] border border-[var(--border)] bg-[var(--panel-strong)] p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="font-semibold text-[var(--text)]">{project.project_name}</div>
                  <div className="mt-1 text-sm text-[var(--muted)]">
                    {project.progress_percentage}% complete · {project.progress_change >= 0 ? "+" : ""}
                    {project.progress_change} this window
                  </div>
                </div>
                <Badge tone={statusTone(project.status)}>{projectStatusLabel(project.status)}</Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
