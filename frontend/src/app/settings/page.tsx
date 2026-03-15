"use client";

import { ChangeEvent, FormEvent, useCallback, useEffect, useState } from "react";

import { api, ApiError } from "@/lib/api";
import { SettingsView } from "@/lib/types";
import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { EmptyState } from "@/components/empty-state";
import { Input } from "@/components/input";
import { LoadingPanel } from "@/components/loading-panel";
import { PageHeader } from "@/components/page-header";
import { Select } from "@/components/select";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";

const initialSettings = {
  email: "",
  full_name: "",
  timezone: "America/Costa_Rica",
  theme_preference: "system" as const,
  weekly_focus_goal_minutes: 600,
};

export default function SettingsPage() {
  const { token, user, setUser } = useAuth();
  const { setTheme } = useTheme();
  const [settings, setSettings] = useState<SettingsView>(initialSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const loadSettings = useCallback(async () => {
    if (!token) {
      return;
    }

    setLoading(true);
    try {
      setSettings(await api.getSettings(token));
      setError("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to load settings.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  function handleChange(event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = event.target;
    setSettings((current) => ({
      ...current,
      [name]: name === "weekly_focus_goal_minutes" ? Number(value) : value,
    }) as SettingsView);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      return;
    }

    setSaving(true);
    setError("");
    try {
      const updated = await api.updateSettings(token, settings);
      setSettings(updated);
      setTheme(updated.theme_preference);
      if (user) {
        setUser({
          ...user,
          full_name: updated.full_name,
          timezone: updated.timezone,
          theme_preference: updated.theme_preference,
          weekly_focus_goal_minutes: updated.weekly_focus_goal_minutes,
        });
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to save settings.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <LoadingPanel label="Loading settings..." />;
  }

  if (error && !settings.email) {
    return <EmptyState description={error} title="Settings unavailable" />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        description="Preference management, theme controls, and integration settings for Life Observability Platform."
        eyebrow="Configuration"
        title="Settings"
      />

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="space-y-5">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-[var(--text)]">Email</span>
              <Input disabled name="email" value={settings.email} />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-[var(--text)]">Full name</span>
              <Input name="full_name" onChange={handleChange} value={settings.full_name} />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-[var(--text)]">Timezone</span>
                <Input name="timezone" onChange={handleChange} value={settings.timezone} />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-[var(--text)]">Theme</span>
                <Select name="theme_preference" onChange={handleChange} value={settings.theme_preference}>
                  <option value="system">System</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </Select>
              </label>
            </div>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-[var(--text)]">Weekly focus goal (minutes)</span>
              <Input
                min="0"
                name="weekly_focus_goal_minutes"
                onChange={handleChange}
                type="number"
                value={String(settings.weekly_focus_goal_minutes)}
              />
            </label>

            {error ? (
              <div className="rounded-2xl bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger)]">
                {error}
              </div>
            ) : null}

            <Button className="w-full" disabled={saving} type="submit">
              {saving ? "Saving..." : "Save settings"}
            </Button>
          </form>
        </Card>

        <div className="space-y-4">
          <Card className="space-y-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">Roadmap ready</div>
              <div className="mt-2 text-xl font-semibold text-[var(--text)]">Future integrations</div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {[
                "AI-generated summaries",
                "Notion synchronization",
                "Calendar sync",
                "GitHub activity ingestion",
                "Observability metrics export",
                "k3s deployment profile",
              ].map((item) => (
                <div key={item} className="rounded-[24px] border border-[var(--border)] bg-[var(--panel-strong)] p-4 text-sm text-[var(--muted)]">
                  {item}
                </div>
              ))}
            </div>
          </Card>

          <Card className="space-y-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">Scaffold notes</div>
              <div className="mt-2 text-xl font-semibold text-[var(--text)]">What is already in place</div>
            </div>
            <ul className="space-y-3 text-sm leading-6 text-[var(--muted)]">
              <li className="rounded-[20px] bg-[var(--panel-strong)] px-4 py-3">
                REST contracts are isolated from analytics services, which keeps future AI summary providers swappable.
              </li>
              <li className="rounded-[20px] bg-[var(--panel-strong)] px-4 py-3">
                Seed data spans tasks, habits, journal entries, projects, updates, and metric snapshots for realistic demos.
              </li>
              <li className="rounded-[20px] bg-[var(--panel-strong)] px-4 py-3">
                Docker compose aligns frontend, backend, and PostgreSQL into one dev environment.
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
