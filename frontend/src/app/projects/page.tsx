"use client";

import { ChangeEvent, FormEvent, useCallback, useEffect, useState } from "react";

import { api, ApiError } from "@/lib/api";
import { Project, ProjectStatus } from "@/lib/types";
import { formatDate, projectStatusLabel, statusTone } from "@/lib/utils";
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
  name: "",
  description: "",
  status: "planning" as ProjectStatus,
  progress_percentage: "0",
  start_date: "",
  target_date: "",
  initial_update: "",
};

export default function ProjectsPage() {
  const { token } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [updateDrafts, setUpdateDrafts] = useState<Record<string, { content: string; progress_percentage: string }>>({});

  const loadProjects = useCallback(async () => {
    if (!token) {
      return;
    }

    setLoading(true);
    setError("");
    try {
      const data = await api.listProjects(token);
      setProjects(data);
      setUpdateDrafts((current) => {
        const next = { ...current };
        data.forEach((project) => {
          next[project.id] ??= {
            content: "",
            progress_percentage: String(project.progress_percentage),
          };
        });
        return next;
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to load projects.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  function resetForm() {
    setSelectedProjectId(null);
    setForm(initialForm);
    setFormError("");
  }

  function handleFormChange(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }) as typeof initialForm);
  }

  function handleEdit(project: Project) {
    setSelectedProjectId(project.id);
    setForm({
      name: project.name,
      description: project.description ?? "",
      status: project.status,
      progress_percentage: String(project.progress_percentage),
      start_date: project.start_date ?? "",
      target_date: project.target_date ?? "",
      initial_update: "",
    });
  }

  function handleUpdateDraftChange(
    projectId: string,
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = event.target;
    setUpdateDrafts((current) => ({
      ...current,
      [projectId]: {
        ...(current[projectId] ?? { content: "", progress_percentage: "0" }),
        [name]: value,
      },
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    if (!token) {
      return;
    }

    if (!form.name.trim()) {
      setFormError("Project name is required.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        status: form.status,
        progress_percentage: Number(form.progress_percentage),
        start_date: form.start_date || null,
        target_date: form.target_date || null,
        initial_update: form.initial_update.trim() || null,
      };

      if (selectedProjectId) {
        await api.updateProject(token, selectedProjectId, payload);
      } else {
        await api.createProject(token, payload);
      }

      resetForm();
      await loadProjects();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Unable to save project.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddUpdate(projectId: string) {
    if (!token) {
      return;
    }

    const draft = updateDrafts[projectId];
    if (!draft?.content.trim()) {
      setError("Project update content is required.");
      return;
    }

    await api.addProjectUpdate(token, projectId, {
      content: draft.content.trim(),
      progress_percentage: Number(draft.progress_percentage),
    });

    setUpdateDrafts((current) => ({
      ...current,
      [projectId]: {
        content: "",
        progress_percentage: current[projectId]?.progress_percentage ?? "0",
      },
    }));
    await loadProjects();
  }

  async function handleDelete(projectId: string) {
    if (!token) {
      return;
    }

    await api.deleteProject(token, projectId);
    if (selectedProjectId === projectId) {
      resetForm();
    }
    await loadProjects();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        description="Track initiative health with visible progress, status, and update cadence."
        eyebrow="Delivery"
        title="Projects"
      />

      <div className="grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
        <Card className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
                {selectedProjectId ? "Update project" : "New project"}
              </div>
              <div className="mt-2 text-xl font-semibold text-[var(--text)]">
                {selectedProjectId ? "Edit current initiative" : "Add an initiative"}
              </div>
            </div>
            {selectedProjectId ? (
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
                <span className="text-sm font-medium text-[var(--text)]">Status</span>
                <Select name="status" onChange={handleFormChange} value={form.status}>
                  <option value="planning">Planning</option>
                  <option value="active">Active</option>
                  <option value="at_risk">At risk</option>
                  <option value="completed">Completed</option>
                </Select>
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-[var(--text)]">Progress %</span>
                <Input
                  max="100"
                  min="0"
                  name="progress_percentage"
                  onChange={handleFormChange}
                  type="number"
                  value={form.progress_percentage}
                />
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-[var(--text)]">Start date</span>
                <Input name="start_date" onChange={handleFormChange} type="date" value={form.start_date} />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-[var(--text)]">Target date</span>
                <Input name="target_date" onChange={handleFormChange} type="date" value={form.target_date} />
              </label>
            </div>

            {!selectedProjectId ? (
              <label className="block space-y-2">
                <span className="text-sm font-medium text-[var(--text)]">Initial update</span>
                <Textarea name="initial_update" onChange={handleFormChange} value={form.initial_update} />
              </label>
            ) : null}

            {formError ? (
              <div className="rounded-2xl bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger)]">
                {formError}
              </div>
            ) : null}

            <Button className="w-full" disabled={saving} type="submit">
              {saving ? "Saving..." : selectedProjectId ? "Update project" : "Create project"}
            </Button>
          </form>
        </Card>

        <div className="space-y-4">
          {loading ? (
            <LoadingPanel label="Loading projects..." />
          ) : error ? (
            <EmptyState description={error} title="Projects unavailable" />
          ) : projects.length ? (
            projects.map((project) => {
              const draft = updateDrafts[project.id] ?? {
                content: "",
                progress_percentage: String(project.progress_percentage),
              };
              return (
                <Card key={project.id} className="space-y-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                      <div className="text-xl font-semibold text-[var(--text)]">{project.name}</div>
                      <div className="text-sm text-[var(--muted)]">
                        {project.start_date ? formatDate(project.start_date) : "No start"} to {formatDate(project.target_date)}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge tone={statusTone(project.status)}>{projectStatusLabel(project.status)}</Badge>
                      <Button onClick={() => handleEdit(project)} variant="ghost">
                        Edit
                      </Button>
                      <Button onClick={() => void handleDelete(project.id)} variant="danger">
                        Delete
                      </Button>
                    </div>
                  </div>

                  {project.description ? <p className="text-sm leading-6 text-[var(--muted)]">{project.description}</p> : null}

                  <div>
                    <div className="h-3 overflow-hidden rounded-full bg-[var(--soft)]">
                      <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${project.progress_percentage}%` }} />
                    </div>
                    <div className="mt-2 text-sm text-[var(--muted)]">{project.progress_percentage}% complete</div>
                  </div>

                  <div className="space-y-3">
                    <div className="text-sm font-semibold text-[var(--text)]">Recent updates</div>
                    {project.updates.length ? (
                      project.updates.slice(0, 3).map((update) => (
                        <div key={update.id} className="rounded-2xl border border-[var(--border)] bg-[var(--panel-strong)] p-4">
                          <div className="text-sm font-semibold text-[var(--text)]">{update.progress_percentage}%</div>
                          <div className="mt-1 text-sm leading-6 text-[var(--muted)]">{update.content}</div>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-[var(--muted)]">No updates yet.</div>
                    )}
                  </div>

                  <div className="space-y-3 rounded-[24px] border border-[var(--border)] bg-[var(--panel-strong)] p-4">
                    <div className="text-sm font-semibold text-[var(--text)]">Add progress update</div>
                    <Textarea
                      name="content"
                      onChange={(event) => handleUpdateDraftChange(project.id, event)}
                      value={draft.content}
                    />
                    <div className="flex flex-col gap-3 md:flex-row">
                      <Input
                        max="100"
                        min="0"
                        name="progress_percentage"
                        onChange={(event) => handleUpdateDraftChange(project.id, event)}
                        type="number"
                        value={draft.progress_percentage}
                      />
                      <Button onClick={() => void handleAddUpdate(project.id)}>Save update</Button>
                    </div>
                  </div>
                </Card>
              );
            })
          ) : (
            <EmptyState
              description="Define the initiatives that matter and update them with visible progress signals."
              title="No projects yet"
            />
          )}
        </div>
      </div>
    </div>
  );
}
