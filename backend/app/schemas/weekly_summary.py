from datetime import date
from uuid import UUID

from app.models.enums import ProjectStatus
from app.schemas.common import ORMModel
from app.schemas.metrics import TimeSeriesPoint


class HabitHighlight(ORMModel):
    habit_id: UUID
    habit_name: str
    completion_rate: float
    current_streak: int


class ProjectMovement(ORMModel):
    project_id: UUID
    project_name: str
    status: ProjectStatus
    progress_percentage: int
    progress_change: int


class WeeklySummaryRead(ORMModel):
    period_start: date
    period_end: date
    completed_tasks: int
    tasks_created: int
    focus_minutes: int
    journal_entries: int
    habit_completion_rate: float
    wins: list[str]
    risks: list[str]
    next_focus: list[str]
    daily_focus: list[TimeSeriesPoint]
    habit_highlights: list[HabitHighlight]
    project_movements: list[ProjectMovement]
