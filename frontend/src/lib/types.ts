export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high";
export type HabitFrequency = "daily" | "weekly";
export type ProjectStatus = "planning" | "active" | "at_risk" | "completed";
export type ThemePreference = "system" | "light" | "dark";

export interface User {
  id: string;
  email: string;
  full_name: string;
  timezone: string;
  theme_preference: ThemePreference;
  weekly_focus_goal_minutes: number;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  estimated_minutes: number;
  focus_minutes: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  logged_on: string;
  completed: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  color: string;
  target_frequency: HabitFrequency;
  target_days_per_week: number;
  is_active: boolean;
  completed_today: boolean;
  current_streak: number;
  recent_logs: HabitLog[];
  created_at: string;
  updated_at: string;
}

export interface JournalEntry {
  id: string;
  user_id: string;
  title: string;
  content: string;
  entry_date: string;
  mood_score: number | null;
  focus_score: number | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectUpdate {
  id: string;
  project_id: string;
  content: string;
  progress_percentage: number;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  progress_percentage: number;
  start_date: string | null;
  target_date: string | null;
  updates: ProjectUpdate[];
  created_at: string;
  updated_at: string;
}

export interface SettingsView {
  email: string;
  full_name: string;
  timezone: string;
  theme_preference: ThemePreference;
  weekly_focus_goal_minutes: number;
}

export interface TimeSeriesPoint {
  date: string;
  label: string;
  value: number;
}

export interface DashboardOverview {
  user: User;
  stats: {
    open_tasks: number;
    completed_tasks_week: number;
    habit_completion_rate: number;
    journal_entries_week: number;
    active_projects: number;
    focus_minutes_week: number;
  };
  upcoming_tasks: Array<{
    id: string;
    title: string;
    status: TaskStatus;
    priority: TaskPriority;
    due_date: string | null;
  }>;
  todays_habits: Array<{
    id: string;
    name: string;
    color: string;
    completed_today: boolean;
    current_streak: number;
    target_days_per_week: number;
  }>;
  active_projects: Array<{
    id: string;
    name: string;
    status: ProjectStatus;
    progress_percentage: number;
    target_date: string | null;
  }>;
  journal_prompt: string;
}

export interface HabitConsistencyItem {
  habit_id: string;
  habit_name: string;
  color: string;
  completion_rate: number;
  completed_days: number;
  target_days: number;
  current_streak: number;
}

export interface ProjectProgressItem {
  project_id: string;
  project_name: string;
  status: ProjectStatus;
  progress_percentage: number;
  trend: TimeSeriesPoint[];
}

export interface HabitHeatmapCell {
  date: string;
  label: string;
  completed: boolean;
  intensity: number;
}

export interface HabitHeatmapRow {
  habit_id: string;
  habit_name: string;
  color: string;
  cells: HabitHeatmapCell[];
}

export interface ProjectVelocityItem {
  project_id: string;
  project_name: string;
  status: ProjectStatus;
  current_progress_percentage: number;
  velocity: number;
  progress_delta: number;
  updates_in_window: number;
}

export interface MetricsOverview {
  focus_time: TimeSeriesPoint[];
  task_completion_trend: TimeSeriesPoint[];
  journal_frequency: TimeSeriesPoint[];
  journal_activity_timeline: TimeSeriesPoint[];
  habit_consistency: HabitConsistencyItem[];
  habit_consistency_heatmap: HabitHeatmapRow[];
  project_progress: ProjectProgressItem[];
  project_progress_velocity: ProjectVelocityItem[];
  summary: {
    total_focus_minutes: number;
    average_daily_focus_minutes: number;
    journal_entries_logged: number;
    average_habit_completion_rate: number;
    tasks_completed: number;
  };
}

export interface WeeklySummary {
  period_start: string;
  period_end: string;
  completed_tasks: number;
  tasks_created: number;
  focus_minutes: number;
  journal_entries: number;
  habit_completion_rate: number;
  wins: string[];
  risks: string[];
  next_focus: string[];
  daily_focus: TimeSeriesPoint[];
  habit_highlights: Array<{
    habit_id: string;
    habit_name: string;
    completion_rate: number;
    current_streak: number;
  }>;
  project_movements: Array<{
    project_id: string;
    project_name: string;
    status: ProjectStatus;
    progress_percentage: number;
    progress_change: number;
  }>;
}
