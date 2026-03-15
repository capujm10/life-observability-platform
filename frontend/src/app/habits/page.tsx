"use client";

import { ChangeEvent, FormEvent, useCallback, useEffect, useState } from "react";

import { api, ApiError } from "@/lib/api";
import { Habit, HabitFrequency } from "@/lib/types";
import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { EmptyState } from "@/components/empty-state";
import { Input } from "@/components/input";
import { LoadingPanel } from "@/components/loading-panel";
import { PageHeader } from "@/components/page-header";
import { Select } from "@/components/select";
import { Textarea } from "@/components/textarea";
import { useAuth } from "@/hooks/use-auth";

const initialForm = {
  name: "",
  description: "",
  color: "#0f766e",
  target_frequency: "daily" as HabitFrequency,
  target_days_per_week: "5",
  is_active: "true",
};

export default function HabitsPage() {
  const { token } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const loadHabits = useCallback(async () => {
    if (!token) {
      return;
    }

    setLoading(true);
    setError("");
    try {
      setHabits(await api.listHabits(token));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to load habits.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadHabits();
  }, [loadHabits]);

  function resetForm() {
    setSelectedHabitId(null);
    setForm(initialForm);
    setFormError("");
  }

  function handleFormChange(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }) as typeof initialForm);
  }

  function handleEdit(habit: Habit) {
    setSelectedHabitId(habit.id);
    setForm({
      name: habit.name,
      description: habit.description ?? "",
      color: habit.color,
      target_frequency: habit.target_frequency,
      target_days_per_week: String(habit.target_days_per_week),
      is_active: String(habit.is_active),
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    if (!token) {
      return;
    }

    if (!form.name.trim()) {
      setFormError("Habit name is required.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        color: form.color,
        target_frequency: form.target_frequency,
        target_days_per_week: Number(form.target_days_per_week || 0),
        is_active: form.is_active === "true",
      };

      if (selectedHabitId) {
        await api.updateHabit(token, selectedHabitId, payload);
      } else {
        await api.createHabit(token, payload);
      }

      resetForm();
      await loadHabits();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Unable to save habit.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleToday(habit: Habit) {
    if (!token) {
      return;
    }

    await api.upsertHabitLog(token, habit.id, { completed: !habit.completed_today });
    await loadHabits();
  }

  async function handleDelete(habitId: string) {
    if (!token) {
      return;
    }

    await api.deleteHabit(token, habitId);
    if (selectedHabitId === habitId) {
      resetForm();
    }
    await loadHabits();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        description="Track repeatable behaviors with just enough structure to keep momentum visible."
        eyebrow="Rituals"
        title="Habits"
      />

      <div className="grid gap-6 xl:grid-cols-[0.86fr_1.14fr]">
        <Card className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
                {selectedHabitId ? "Update habit" : "New habit"}
              </div>
              <div className="mt-2 text-xl font-semibold text-[var(--text)]">
                {selectedHabitId ? "Refine the habit target" : "Add a repeatable behavior"}
              </div>
            </div>
            {selectedHabitId ? (
              <Button onClick={resetForm} variant="ghost">
                Reset
              </Button>
            ) : null}
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-[var(--text)]">Name</span>
              <Input name="name" onChange={handleFormChange} value={form.name} />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-[var(--text)]">Description</span>
              <Textarea name="description" onChange={handleFormChange} value={form.description} />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-[var(--text)]">Color</span>
                <Input name="color" onChange={handleFormChange} type="color" value={form.color} />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-[var(--text)]">Frequency</span>
                <Select name="target_frequency" onChange={handleFormChange} value={form.target_frequency}>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </Select>
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-[var(--text)]">Target days per week</span>
                <Input
                  max="7"
                  min="1"
                  name="target_days_per_week"
                  onChange={handleFormChange}
                  type="number"
                  value={form.target_days_per_week}
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-[var(--text)]">Status</span>
                <Select name="is_active" onChange={handleFormChange} value={form.is_active}>
                  <option value="true">Active</option>
                  <option value="false">Paused</option>
                </Select>
              </label>
            </div>

            {formError ? (
              <div className="rounded-2xl bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger)]">
                {formError}
              </div>
            ) : null}

            <Button className="w-full" disabled={saving} type="submit">
              {saving ? "Saving..." : selectedHabitId ? "Update habit" : "Create habit"}
            </Button>
          </form>
        </Card>

        <div className="space-y-4">
          {loading ? (
            <LoadingPanel label="Loading habits..." />
          ) : error ? (
            <EmptyState description={error} title="Habits unavailable" />
          ) : habits.length ? (
            habits.map((habit) => (
              <Card key={habit.id} className="space-y-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-4 w-4 rounded-full" style={{ backgroundColor: habit.color }} />
                    <div>
                      <div className="text-lg font-semibold text-[var(--text)]">{habit.name}</div>
                      <div className="text-sm text-[var(--muted)]">
                        {habit.target_days_per_week} days per week · {habit.current_streak}-day streak
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={() => void handleToggleToday(habit)} variant="secondary">
                      {habit.completed_today ? "Undo today" : "Mark today"}
                    </Button>
                    <Button onClick={() => handleEdit(habit)} variant="ghost">
                      Edit
                    </Button>
                    <Button onClick={() => void handleDelete(habit.id)} variant="danger">
                      Delete
                    </Button>
                  </div>
                </div>

                {habit.description ? <p className="text-sm leading-6 text-[var(--muted)]">{habit.description}</p> : null}

                <div className="grid grid-cols-7 gap-2">
                  {habit.recent_logs.map((log) => (
                    <div
                      key={log.id}
                      className="rounded-2xl border border-[var(--border)] px-3 py-2 text-center text-xs"
                    >
                      <div className="font-semibold text-[var(--text)]">
                        {new Date(log.logged_on).toLocaleDateString("en-US", { weekday: "short" })}
                      </div>
                      <div className={log.completed ? "text-[var(--success)]" : "text-[var(--muted)]"}>
                        {log.completed ? "Done" : "Miss"}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ))
          ) : (
            <EmptyState
              description="Start with one habit that has a measurable definition and realistic target."
              title="No habits yet"
            />
          )}
        </div>
      </div>
    </div>
  );
}
