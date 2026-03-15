from uuid import UUID

from app.models.enums import ProjectStatus
from app.schemas.common import ORMModel


class TimeSeriesPoint(ORMModel):
    date: str
    label: str
    value: int


class HabitConsistencyItem(ORMModel):
    habit_id: UUID
    habit_name: str
    color: str
    completion_rate: float
    completed_days: int
    target_days: int
    current_streak: int


class ProjectProgressItem(ORMModel):
    project_id: UUID
    project_name: str
    status: ProjectStatus
    progress_percentage: int
    trend: list[TimeSeriesPoint]


class HabitHeatmapCell(ORMModel):
    date: str
    label: str
    completed: bool
    intensity: float


class HabitHeatmapRow(ORMModel):
    habit_id: UUID
    habit_name: str
    color: str
    cells: list[HabitHeatmapCell]


class ProjectVelocityItem(ORMModel):
    project_id: UUID
    project_name: str
    status: ProjectStatus
    current_progress_percentage: int
    velocity: float
    progress_delta: int
    updates_in_window: int


class MetricsSummary(ORMModel):
    total_focus_minutes: int
    average_daily_focus_minutes: int
    journal_entries_logged: int
    average_habit_completion_rate: float
    tasks_completed: int


class MetricsOverview(ORMModel):
    focus_time: list[TimeSeriesPoint]
    task_completion_trend: list[TimeSeriesPoint]
    journal_frequency: list[TimeSeriesPoint]
    journal_activity_timeline: list[TimeSeriesPoint]
    habit_consistency: list[HabitConsistencyItem]
    habit_consistency_heatmap: list[HabitHeatmapRow]
    project_progress: list[ProjectProgressItem]
    project_progress_velocity: list[ProjectVelocityItem]
    summary: MetricsSummary
