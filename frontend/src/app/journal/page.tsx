"use client";

import { ChangeEvent, FormEvent, useCallback, useEffect, useState } from "react";

import { api, ApiError } from "@/lib/api";
import { JournalEntry } from "@/lib/types";
import { formatLongDate } from "@/lib/utils";
import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { EmptyState } from "@/components/empty-state";
import { Input } from "@/components/input";
import { LoadingPanel } from "@/components/loading-panel";
import { PageHeader } from "@/components/page-header";
import { Textarea } from "@/components/textarea";
import { useAuth } from "@/hooks/use-auth";

const today = new Date().toISOString().slice(0, 10);

const initialForm = {
  title: "",
  content: "",
  entry_date: today,
  mood_score: "4",
  focus_score: "4",
};

export default function JournalPage() {
  const { token } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const loadEntries = useCallback(async () => {
    if (!token) {
      return;
    }

    setLoading(true);
    setError("");
    try {
      setEntries(await api.listJournalEntries(token));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to load journal entries.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadEntries();
  }, [loadEntries]);

  function resetForm() {
    setSelectedEntryId(null);
    setForm(initialForm);
    setFormError("");
  }

  function handleFormChange(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }) as typeof initialForm);
  }

  function handleEdit(entry: JournalEntry) {
    setSelectedEntryId(entry.id);
    setForm({
      title: entry.title,
      content: entry.content,
      entry_date: entry.entry_date,
      mood_score: String(entry.mood_score ?? 4),
      focus_score: String(entry.focus_score ?? 4),
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    if (!token) {
      return;
    }

    if (!form.title.trim() || !form.content.trim()) {
      setFormError("Title and content are required.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        content: form.content.trim(),
        entry_date: form.entry_date,
        mood_score: Number(form.mood_score),
        focus_score: Number(form.focus_score),
      };

      if (selectedEntryId) {
        await api.updateJournalEntry(token, selectedEntryId, payload);
      } else {
        await api.createJournalEntry(token, payload);
      }

      resetForm();
      await loadEntries();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Unable to save journal entry.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(entryId: string) {
    if (!token) {
      return;
    }

    await api.deleteJournalEntry(token, entryId);
    if (selectedEntryId === entryId) {
      resetForm();
    }
    await loadEntries();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        description="Capture reflection with enough structure to turn thoughts into a usable signal."
        eyebrow="Reflection"
        title="Journal"
      />

      <div className="grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
        <Card className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
                {selectedEntryId ? "Update entry" : "New entry"}
              </div>
              <div className="mt-2 text-xl font-semibold text-[var(--text)]">
                {selectedEntryId ? "Refine the reflection" : "Write today&apos;s reflection"}
              </div>
            </div>
            {selectedEntryId ? (
              <Button onClick={resetForm} variant="ghost">
                Reset
              </Button>
            ) : null}
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-[var(--text)]">Title</span>
              <Input name="title" onChange={handleFormChange} value={form.title} />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-[var(--text)]">Content</span>
              <Textarea name="content" onChange={handleFormChange} value={form.content} />
            </label>

            <div className="grid gap-4 md:grid-cols-3">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-[var(--text)]">Date</span>
                <Input name="entry_date" onChange={handleFormChange} type="date" value={form.entry_date} />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-[var(--text)]">Mood</span>
                <Input max="5" min="1" name="mood_score" onChange={handleFormChange} type="number" value={form.mood_score} />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-[var(--text)]">Focus</span>
                <Input max="5" min="1" name="focus_score" onChange={handleFormChange} type="number" value={form.focus_score} />
              </label>
            </div>

            {formError ? (
              <div className="rounded-2xl bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger)]">
                {formError}
              </div>
            ) : null}

            <Button className="w-full" disabled={saving} type="submit">
              {saving ? "Saving..." : selectedEntryId ? "Update entry" : "Create entry"}
            </Button>
          </form>
        </Card>

        <div className="space-y-4">
          {loading ? (
            <LoadingPanel label="Loading journal..." />
          ) : error ? (
            <EmptyState description={error} title="Journal unavailable" />
          ) : entries.length ? (
            entries.map((entry) => (
              <Card key={entry.id} className="space-y-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-2">
                    <div className="text-xl font-semibold text-[var(--text)]">{entry.title}</div>
                    <div className="text-sm text-[var(--muted)]">{formatLongDate(entry.entry_date)}</div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={() => handleEdit(entry)} variant="ghost">
                      Edit
                    </Button>
                    <Button onClick={() => void handleDelete(entry.id)} variant="danger">
                      Delete
                    </Button>
                  </div>
                </div>
                <p className="text-sm leading-7 text-[var(--muted)]">{entry.content}</p>
                <div className="flex gap-4 text-sm text-[var(--muted)]">
                  <span>Mood {entry.mood_score ?? "-"}/5</span>
                  <span>Focus {entry.focus_score ?? "-"}/5</span>
                </div>
              </Card>
            ))
          ) : (
            <EmptyState
              description="A short daily reflection is enough to build a useful signal."
              title="No journal entries yet"
            />
          )}
        </div>
      </div>
    </div>
  );
}
