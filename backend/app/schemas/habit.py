from datetime import date
from uuid import UUID

from app.models.enums import HabitFrequency
from app.schemas.common import ORMModel, TimestampedModel


class HabitLogBase(ORMModel):
    logged_on: date
    completed: bool = True
    notes: str | None = None


class HabitLogCreate(ORMModel):
    logged_on: date | None = None
    completed: bool = True
    notes: str | None = None


class HabitLogRead(TimestampedModel):
    habit_id: UUID
    logged_on: date
    completed: bool
    notes: str | None


class HabitBase(ORMModel):
    name: str
    description: str | None = None
    color: str = "#3b82f6"
    target_frequency: HabitFrequency = HabitFrequency.daily
    target_days_per_week: int = 7
    is_active: bool = True


class HabitCreate(HabitBase):
    pass


class HabitUpdate(ORMModel):
    name: str | None = None
    description: str | None = None
    color: str | None = None
    target_frequency: HabitFrequency | None = None
    target_days_per_week: int | None = None
    is_active: bool | None = None


class HabitRead(TimestampedModel):
    user_id: UUID
    name: str
    description: str | None
    color: str
    target_frequency: HabitFrequency
    target_days_per_week: int
    is_active: bool
    completed_today: bool = False
    current_streak: int = 0
    recent_logs: list[HabitLogRead] = []

