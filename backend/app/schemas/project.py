from datetime import date
from uuid import UUID

from app.models.enums import ProjectStatus
from app.schemas.common import ORMModel, TimestampedModel


class ProjectUpdateCreate(ORMModel):
    content: str
    progress_percentage: int


class ProjectUpdateRead(TimestampedModel):
    project_id: UUID
    content: str
    progress_percentage: int


class ProjectBase(ORMModel):
    name: str
    description: str | None = None
    status: ProjectStatus = ProjectStatus.planning
    progress_percentage: int = 0
    start_date: date | None = None
    target_date: date | None = None


class ProjectCreate(ProjectBase):
    initial_update: str | None = None


class ProjectUpdate(ProjectBase):
    name: str | None = None
    description: str | None = None
    status: ProjectStatus | None = None
    progress_percentage: int | None = None
    start_date: date | None = None
    target_date: date | None = None


class ProjectRead(TimestampedModel):
    user_id: UUID
    name: str
    description: str | None
    status: ProjectStatus
    progress_percentage: int
    start_date: date | None
    target_date: date | None
    updates: list[ProjectUpdateRead] = []

