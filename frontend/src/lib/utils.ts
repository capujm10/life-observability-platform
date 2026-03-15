import { ProjectStatus, TaskPriority, TaskStatus } from "@/lib/types";

export function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function formatDate(value: string | null | undefined) {
  if (!value) {
    return "No date";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export function formatLongDate(value: string | null | undefined) {
  if (!value) {
    return "No date";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function formatMinutes(minutes: number) {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining ? `${hours}h ${remaining}m` : `${hours}h`;
}

export function toPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export function taskStatusLabel(status: TaskStatus) {
  return status.replaceAll("_", " ");
}

export function projectStatusLabel(status: ProjectStatus) {
  return status.replaceAll("_", " ");
}

export function priorityTone(priority: TaskPriority) {
  switch (priority) {
    case "high":
      return "danger";
    case "medium":
      return "warning";
    default:
      return "neutral";
  }
}

export function statusTone(status: TaskStatus | ProjectStatus) {
  switch (status) {
    case "done":
    case "completed":
      return "success";
    case "in_progress":
    case "active":
      return "info";
    case "at_risk":
      return "warning";
    default:
      return "neutral";
  }
}
