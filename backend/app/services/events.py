from datetime import datetime
from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import MetricEvent
from app.schemas.event import MetricEventRead


def create_metric_event(
    db: Session,
    *,
    user_id: UUID,
    event_type: str,
    value: float = 1.0,
    metadata: dict[str, Any] | None = None,
    timestamp: datetime | None = None,
    commit: bool = False,
) -> MetricEvent:
    event_data = dict(
        user_id=user_id,
        event_type=event_type,
        value=value,
        event_metadata=metadata or {},
    )
    if timestamp is not None:
        event_data["timestamp"] = timestamp
    event = MetricEvent(**event_data)
    db.add(event)
    db.flush()
    if commit:
        db.commit()
        db.refresh(event)
    return event


def list_metric_events(
    db: Session,
    *,
    user_id: UUID,
    event_type: str | None = None,
    start_time: datetime | None = None,
    end_time: datetime | None = None,
    limit: int = 100,
) -> list[MetricEvent]:
    query = select(MetricEvent).where(MetricEvent.user_id == user_id)
    if event_type:
        query = query.where(MetricEvent.event_type == event_type)
    if start_time:
        query = query.where(MetricEvent.timestamp >= start_time)
    if end_time:
        query = query.where(MetricEvent.timestamp <= end_time)
    query = query.order_by(MetricEvent.timestamp.desc()).limit(limit)
    return list(db.scalars(query).all())


def serialize_metric_event(event: MetricEvent) -> MetricEventRead:
    return MetricEventRead(
        id=event.id,
        user_id=event.user_id,
        event_type=event.event_type,
        value=event.value,
        metadata=event.event_metadata or {},
        timestamp=event.timestamp,
    )
