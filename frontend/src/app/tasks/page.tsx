"use client";

import { ChangeEvent, FormEvent, useCallback, useDeferredValue, useEffect, useState } from "react";

import { api, ApiError } from "@/lib/api";
import { Task, TaskPriority, TaskStatus } from "@/lib/types";
import { formatDate, formatMinutes, priorityTone, statusTone, taskStatusLabel } from "@/lib/utils";
import { Badge } from "@/components/badge";
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
  title: "",
  description: "",
  category: "",
  status: "todo" as TaskStatus,
  priority: "medium" as TaskPriority,
  due_date: "",
  estimated_minutes: "30",
  focus_minutes: "0",
};

export default function TasksPage() {
  const { token } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [form, setForm] = useState(initialForm);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const loadTasks = useCallback(async () => {
    if (!token) {
      return;
    }

    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (deferredSearch) {
        params.set("search", deferredSearch);
      }
      if (statusFilter) {
        params.set("status", statusFilter);
      }
      if (priorityFilter) {
        params.set("priority", priorityFilter);
      }
      const nextTasks = await api.listTasks(token, params);
      setTasks(nextTasks);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to load tasks.");
    } finally {
      setLoading(false);
    }
  }, [deferredSearch, priorityFilter, statusFilter, token]);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  function resetForm() {
    setSelectedTaskId(null);
    setForm(initialForm);
    setFormError("");
  }

  function handleFormChange(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }) as typeof initialForm);
  }

  function handleEdit(task: Task) {
    setSelectedTaskId(task.id);
    setForm({
      title: task.title,
      description: task.description ?? "",
      category: task.category ?? "",
      status: task.status,
      priority: task.priority,
      due_date: task.due_date ?? "",
      estimated_minutes: String(task.estimated_minutes),
      focus_minutes: String(task.focus_minutes),
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    if (!token) {
      return;
    }

    if (!form.title.trim()) {
      setFormError("Task title is required.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        category: form.category.trim() || null,
        status: form.status,
        priority: form.priority,
        due_date: form.due_date || null,
        estimated_minutes: Number(form.estimated_minutes || 0),
        focus_minutes: Number(form.focus_minutes || 0),
      };

      if (selectedTaskId) {
        await api.updateTask(token, selectedTaskId, payload);
      } else {
        await api.createTask(token, payload);
      }

      resetForm();
      await loadTasks();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Unable to save task.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(taskId: string) {
    if (!token) {
      return;
    }

    await api.deleteTask(token, taskId);
    if (selectedTaskId === taskId) {
      resetForm();
    }
    await loadTasks();
  }

  async function handleToggleComplete(task: Task) {
    if (!token) {
      return;
    }

    await api.updateTask(token, task.id, {
      status: task.status === "done" ? "todo" : "done",
    });
    await loadTasks();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        description="Keep the work queue readable, prioritized, and ready for execution."
        eyebrow="Execution"
        title="Tasks"
      />

      <div className="grid gap-6 xl:grid-cols-[0.88fr_1.12fr]">
        <Card className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
                {selectedTaskId ? "Update task" : "New task"}
              </div>
              <div className="mt-2 text-xl font-semibold text-[var(--text)]">
                {selectedTaskId ? "Edit selected task" : "Capture the next action"}
              </div>
            </div>
            {selectedTaskId ? (
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
              <span className="text-sm font-medium text-[var(--text)]">Description</span>
              <Textarea name="description" onChange={handleFormChange} value={form.description} />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-[var(--text)]">Category</span>
                <Input name="category" onChange={handleFormChange} value={form.category} />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-[var(--text)]">Due date</span>
                <Input name="due_date" onChange={handleFormChange} type="date" value={form.due_date} />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-[var(--text)]">Status</span>
                <Select name="status" onChange={handleFormChange} value={form.status}>
                  <option value="todo">To do</option>
                  <option value="in_progress">In progress</option>
                  <option value="done">Done</option>
                </Select>
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-[var(--text)]">Priority</span>
                <Select name="priority" onChange={handleFormChange} value={form.priority}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </Select>
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-[var(--text)]">Estimated minutes</span>
                <Input min="0" name="estimated_minutes" onChange={handleFormChange} type="number" value={form.estimated_minutes} />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-[var(--text)]">Focus minutes logged</span>
                <Input min="0" name="focus_minutes" onChange={handleFormChange} type="number" value={form.focus_minutes} />
              </label>
            </div>

            {formError ? (
              <div className="rounded-2xl bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger)]">
                {formError}
              </div>
            ) : null}

            <Button className="w-full" disabled={saving} type="submit">
              {saving ? "Saving..." : selectedTaskId ? "Update task" : "Create task"}
            </Button>
          </form>
        </Card>

        <Card className="space-y-5">
          <div className="grid gap-4 md:grid-cols-[1.2fr_0.4fr_0.4fr]">
            <Input onChange={(event) => setSearch(event.target.value)} placeholder="Search tasks" value={search} />
            <Select onChange={(event) => setStatusFilter(event.target.value)} value={statusFilter}>
              <option value="">All statuses</option>
              <option value="todo">To do</option>
              <option value="in_progress">In progress</option>
              <option value="done">Done</option>
            </Select>
            <Select onChange={(event) => setPriorityFilter(event.target.value)} value={priorityFilter}>
              <option value="">All priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </Select>
          </div>

          {loading ? (
            <LoadingPanel label="Loading tasks..." />
          ) : error ? (
            <EmptyState description={error} title="Tasks unavailable" />
          ) : tasks.length ? (
            <div className="space-y-3">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="rounded-[24px] border border-[var(--border)] bg-[var(--panel-strong)] p-4"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3">
                      <div>
                        <div className="text-lg font-semibold text-[var(--text)]">{task.title}</div>
                        {task.description ? (
                          <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{task.description}</p>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge tone={priorityTone(task.priority)}>{task.priority}</Badge>
                        <Badge tone={statusTone(task.status)}>{taskStatusLabel(task.status)}</Badge>
                        {task.category ? <Badge>{task.category}</Badge> : null}
                      </div>
                      <div className="text-sm text-[var(--muted)]">
                        Due {formatDate(task.due_date)} · Estimate {formatMinutes(task.estimated_minutes)} · Logged {formatMinutes(task.focus_minutes)}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button onClick={() => handleToggleComplete(task)} variant="secondary">
                        {task.status === "done" ? "Reopen" : "Mark done"}
                      </Button>
                      <Button onClick={() => handleEdit(task)} variant="ghost">
                        Edit
                      </Button>
                      <Button onClick={() => void handleDelete(task.id)} variant="danger">
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              description="Add the first task or loosen the active filters."
              title="No tasks match the current view"
            />
          )}
        </Card>
      </div>
    </div>
  );
}
