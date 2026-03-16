import {
  DashboardOverview,
  Habit,
  JournalEntry,
  LoginResponse,
  MetricsOverview,
  Project,
  SettingsView,
  Task,
  User,
  WeeklySummary,
} from "@/lib/types";

const DEFAULT_API_BASE_PATH = "/api/v1";

function resolveApiBaseUrl() {
  const configuredApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (configuredApiBaseUrl) {
    return configuredApiBaseUrl;
  }

  if (typeof window !== "undefined") {
    return `${window.location.origin}${DEFAULT_API_BASE_PATH}`;
  }

  return `http://localhost:8000${DEFAULT_API_BASE_PATH}`;
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  token?: string | null;
  body?: unknown;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers({
    "Content-Type": "application/json",
  });

  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  const response = await fetch(`${resolveApiBaseUrl()}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      payload && typeof payload.detail === "string" ? payload.detail : "Unexpected API error.";
    throw new ApiError(message, response.status);
  }

  return payload as T;
}

export const api = {
  login: (email: string, password: string) =>
    request<LoginResponse>("/auth/login", {
      method: "POST",
      body: { email, password },
    }),
  me: (token: string) => request<User>("/auth/me", { token }),
  getDashboard: (token: string) => request<DashboardOverview>("/dashboard/overview", { token }),
  listTasks: (token: string, params: URLSearchParams) =>
    request<Task[]>(`/tasks?${params.toString()}`, { token }),
  createTask: (token: string, payload: Partial<Task>) =>
    request<Task>("/tasks", { method: "POST", token, body: payload }),
  updateTask: (token: string, taskId: string, payload: Partial<Task>) =>
    request<Task>(`/tasks/${taskId}`, { method: "PUT", token, body: payload }),
  deleteTask: (token: string, taskId: string) =>
    request<void>(`/tasks/${taskId}`, { method: "DELETE", token }),
  listHabits: (token: string) => request<Habit[]>("/habits", { token }),
  createHabit: (token: string, payload: Partial<Habit>) =>
    request<Habit>("/habits", { method: "POST", token, body: payload }),
  updateHabit: (token: string, habitId: string, payload: Partial<Habit>) =>
    request<Habit>(`/habits/${habitId}`, { method: "PUT", token, body: payload }),
  upsertHabitLog: (token: string, habitId: string, payload: Record<string, unknown>) =>
    request<Habit>(`/habits/${habitId}/logs`, { method: "POST", token, body: payload }),
  deleteHabit: (token: string, habitId: string) =>
    request<void>(`/habits/${habitId}`, { method: "DELETE", token }),
  listJournalEntries: (token: string) => request<JournalEntry[]>("/journal-entries", { token }),
  createJournalEntry: (token: string, payload: Partial<JournalEntry>) =>
    request<JournalEntry>("/journal-entries", { method: "POST", token, body: payload }),
  updateJournalEntry: (token: string, entryId: string, payload: Partial<JournalEntry>) =>
    request<JournalEntry>(`/journal-entries/${entryId}`, { method: "PUT", token, body: payload }),
  deleteJournalEntry: (token: string, entryId: string) =>
    request<void>(`/journal-entries/${entryId}`, { method: "DELETE", token }),
  listProjects: (token: string) => request<Project[]>("/projects", { token }),
  createProject: (token: string, payload: Record<string, unknown>) =>
    request<Project>("/projects", { method: "POST", token, body: payload }),
  updateProject: (token: string, projectId: string, payload: Record<string, unknown>) =>
    request<Project>(`/projects/${projectId}`, { method: "PUT", token, body: payload }),
  addProjectUpdate: (token: string, projectId: string, payload: Record<string, unknown>) =>
    request<Project>(`/projects/${projectId}/updates`, { method: "POST", token, body: payload }),
  deleteProject: (token: string, projectId: string) =>
    request<void>(`/projects/${projectId}`, { method: "DELETE", token }),
  getMetrics: (token: string, days = 14) =>
    request<MetricsOverview>(`/metrics/overview?days=${days}`, { token }),
  getWeeklySummary: (token: string) =>
    request<WeeklySummary>("/weekly-summary/current", { token }),
  getSettings: (token: string) => request<SettingsView>("/settings", { token }),
  updateSettings: (token: string, payload: Partial<SettingsView>) =>
    request<SettingsView>("/settings", { method: "PUT", token, body: payload }),
};
