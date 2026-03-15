from datetime import date
from uuid import UUID

from app.models.enums import ProjectStatus, TaskPriority, TaskStatus
from app.schemas.auth import UserRead
from app.schemas.common import ORMModel


class DashboardStats(ORMModel):
    open_tasks: int
    completed_tasks_week: int
    habit_completion_rate: float
    journal_entries_week: int
    active_projects: int
    focus_minutes_week: int


class DashboardTaskItem(ORMModel):
    id: UUID
    title: str
    status: TaskStatus
    priority: TaskPriority
    due_date: date | None = None


class DashboardHabitItem(ORMModel):
    id: UUID
    name: str
    color: str
    completed_today: bool
    current_streak: int
    target_days_per_week: int


class DashboardProjectItem(ORMModel):
    id: UUID
    name: str
    status: ProjectStatus
    progress_percentage: int
    target_date: date | None = None


class DashboardOverview(ORMModel):
    user: UserRead
    stats: DashboardStats
    upcoming_tasks: list[DashboardTaskItem]
    todays_habits: list[DashboardHabitItem]
    active_projects: list[DashboardProjectItem]
    journal_prompt: str

