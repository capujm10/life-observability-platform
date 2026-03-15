from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import Field

from app.schemas.common import ORMModel


class MetricEventCreate(ORMModel):
    event_type: str = Field(min_length=1, max_length=120)
    value: float = 1.0
    metadata: dict[str, Any] = Field(default_factory=dict)
    timestamp: datetime | None = None


class MetricEventRead(ORMModel):
    id: UUID
    user_id: UUID
    event_type: str
    value: float
    metadata: dict[str, Any]
    timestamp: datetime
