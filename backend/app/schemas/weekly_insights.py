from datetime import date, datetime
from typing import Literal
from uuid import UUID

from app.models.enums import ProjectStatus
from app.schemas.common import ORMModel


class WeeklyCountComparison(ORMModel):
    current_week: int
    previous_week: int
    delta: int
    percent_change: float | None


class WeeklyInsightsAggregate(ORMModel):
    tasks_completed: WeeklyCountComparison
    habits_completed: WeeklyCountComparison
    journal_entries: WeeklyCountComparison
    project_updates: WeeklyCountComparison


class ProductivityChangeInsight(ORMModel):
    current_total: int
    previous_total: int
    delta: int
    percent_change: float | None
    direction: Literal["up", "down", "flat"]


class MostConsistentHabitInsight(ORMModel):
    habit_id: UUID
    habit_name: str
    completion_rate: float
    completed_days: int
    target_days: int
    current_streak: int


class JournalingFrequencyInsight(ORMModel):
    current_week_entries: int
    previous_week_entries: int
    active_days_current: int
    active_days_previous: int
    average_entries_per_active_day: float
    percent_change: float | None
    direction: Literal["up", "down", "flat"]


class ProjectActivityProject(ORMModel):
    project_id: UUID
    project_name: str
    status: ProjectStatus
    updates_current_week: int
    updates_previous_week: int
    progress_change: int
    last_update_at: datetime | None


class ProjectActivityInsight(ORMModel):
    total_updates_current: int
    total_updates_previous: int
    active_projects_current: int
    most_active_project: ProjectActivityProject | None
    projects: list[ProjectActivityProject]


class WeeklyInsightsRead(ORMModel):
    period_start: date
    period_end: date
    previous_period_start: date
    previous_period_end: date
    aggregates: WeeklyInsightsAggregate
    productivity_change: ProductivityChangeInsight
    most_consistent_habit: MostConsistentHabitInsight | None
    journaling_frequency: JournalingFrequencyInsight
    project_activity: ProjectActivityInsight
