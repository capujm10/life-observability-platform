"use client";

import { useCallback, useEffect, useState } from "react";

import { api, ApiError } from "@/lib/api";
import { MetricsOverview } from "@/lib/types";
import { formatMinutes, toPercent } from "@/lib/utils";
import { Card } from "@/components/card";
import { HabitHeatmap } from "@/components/charts/habit-heatmap";
import { MetricBarChart } from "@/components/charts/metric-bar-chart";
import { TimeSeriesChart } from "@/components/charts/timeseries-chart";
import { EmptyState } from "@/components/empty-state";
import { LoadingPanel } from "@/components/loading-panel";
import { PageHeader } from "@/components/page-header";
import { Select } from "@/components/select";
import { StatCard } from "@/components/stat-card";
import { useAuth } from "@/hooks/use-auth";

const periodOptions = [
  { label: "14 days", value: 14 },
  { label: "28 days", value: 28 },
  { label: "56 days", value: 56 },
];

function velocityColor(status: string) {
  if (status === "at_risk") {
    return "#ea580c";
  }
  if (status === "completed") {
    return "#166534";
  }
  if (status === "active") {
    return "#0f766e";
  }
  return "#2563eb";
}

export default function MetricsPage() {
  const { token } = useAuth();
  const [days, setDays] = useState(28);
  const [metrics, setMetrics] = useState<MetricsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadMetrics = useCallback(async () => {
    if (!token) {
      return;
    }

    setLoading(true);
    try {
      setMetrics(await api.getMetrics(token, days));
      setError("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to load metrics.");
    } finally {
      setLoading(false);
    }
  }, [days, token]);

  useEffect(() => {
    void loadMetrics();
  }, [loadMetrics]);

  if (loading) {
    return <LoadingPanel label="Loading observability dashboard..." />;
  }

  if (error) {
    return <EmptyState description={error} title="Metrics unavailable" />;
  }

  if (!metrics) {
    return <EmptyState description="No metric series were returned." title="No metrics yet" />;
  }

  const velocityData = metrics.project_progress_velocity.map((project) => ({
    label: project.project_name.length > 18 ? `${project.project_name.slice(0, 18)}...` : project.project_name,
    value: project.velocity,
    color: velocityColor(project.status),
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Select
            className="min-w-32"
            onChange={(event) => setDays(Number(event.target.value))}
            value={String(days)}
          >
            {periodOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        }
        description="An observability-style view of throughput, consistency, reflection, and delivery momentum."
        eyebrow="Observability"
        title="Metrics"
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          hint={`Tracked over the last ${days} days.`}
          label="Tasks completed"
          value={String(metrics.summary.tasks_completed)}
        />
        <StatCard
          hint="Average consistency across active habits."
          label="Habit reliability"
          value={toPercent(metrics.summary.average_habit_completion_rate)}
        />
        <StatCard
          hint="Journal entries created inside the selected window."
          label="Journal activity"
          value={String(metrics.summary.journal_entries_logged)}
        />
        <StatCard
          hint="Average daily focus from metric snapshots."
          label="Focus average"
          value={formatMinutes(metrics.summary.average_daily_focus_minutes)}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="space-y-4">
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
              Throughput
            </div>
            <div className="text-xl font-semibold text-[var(--text)]">Task completion trend</div>
            <p className="text-sm leading-6 text-[var(--muted)]">
              Daily completed tasks over the selected window.
            </p>
          </div>
          <TimeSeriesChart data={metrics.task_completion_trend} color="#0f766e" valueLabel="completed" />
        </Card>

        <Card className="space-y-4">
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
              Reflection
            </div>
            <div className="text-xl font-semibold text-[var(--text)]">Journal activity timeline</div>
            <p className="text-sm leading-6 text-[var(--muted)]">
              Entry cadence across the selected period.
            </p>
          </div>
          <TimeSeriesChart data={metrics.journal_activity_timeline} color="#ea580c" valueLabel="entries" />
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="space-y-4">
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
              Consistency
            </div>
            <div className="text-xl font-semibold text-[var(--text)]">Habit consistency heatmap</div>
            <p className="text-sm leading-6 text-[var(--muted)]">
              A day-by-day view of whether each habit was completed.
            </p>
          </div>
          <HabitHeatmap rows={metrics.habit_consistency_heatmap} />
        </Card>

        <Card className="space-y-4">
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
              Delivery
            </div>
            <div className="text-xl font-semibold text-[var(--text)]">Project progress velocity</div>
            <p className="text-sm leading-6 text-[var(--muted)]">
              Recent percentage-point movement per day for each project.
            </p>
          </div>
          <MetricBarChart data={velocityData} valueLabel="pts/day" />
          <div className="grid gap-3">
            {metrics.project_progress_velocity.map((project) => (
              <div
                key={project.project_id}
                className="flex items-center justify-between rounded-[20px] border border-[var(--border)] bg-[var(--panel-strong)] px-4 py-3"
              >
                <div>
                  <div className="text-sm font-semibold text-[var(--text)]">{project.project_name}</div>
                  <div className="text-xs text-[var(--muted)]">
                    {project.updates_in_window} update(s) in window
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-[var(--text)]">{project.velocity.toFixed(2)} pts/day</div>
                  <div className="text-xs text-[var(--muted)]">
                    {project.progress_delta >= 0 ? "+" : ""}
                    {project.progress_delta} pts · {project.current_progress_percentage}% total
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
