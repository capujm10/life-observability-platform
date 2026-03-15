from datetime import date, datetime
from uuid import UUID

from app.models.enums import TaskPriority, TaskStatus
from app.schemas.common import ORMModel, TimestampedModel


class TaskBase(ORMModel):
    title: str
    description: str | None = None
    category: str | None = None
    status: TaskStatus = TaskStatus.todo
    priority: TaskPriority = TaskPriority.medium
    due_date: date | None = None
    estimated_minutes: int = 30
    focus_minutes: int = 0


class TaskCreate(TaskBase):
    pass


class TaskUpdate(ORMModel):
    title: str | None = None
    description: str | None = None
    category: str | None = None
    status: TaskStatus | None = None
    priority: TaskPriority | None = None
    due_date: date | None = None
    estimated_minutes: int | None = None
    focus_minutes: int | None = None


class TaskRead(TimestampedModel):
    title: str
    description: str | None
    category: str | None
    status: TaskStatus
    priority: TaskPriority
    due_date: date | None
    estimated_minutes: int
    focus_minutes: int
    completed_at: datetime | None
    user_id: UUID

