from datetime import datetime

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db_session
from app.models import User
from app.schemas.event import MetricEventCreate, MetricEventRead
from app.services.events import create_metric_event, list_metric_events, serialize_metric_event

router = APIRouter()


@router.post("/", response_model=MetricEventRead, status_code=status.HTTP_201_CREATED)
def create_event(
    payload: MetricEventCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> MetricEventRead:
    event = create_metric_event(
        db,
        user_id=user.id,
        event_type=payload.event_type,
        value=payload.value,
        metadata=payload.metadata,
        timestamp=payload.timestamp,
        commit=True,
    )
    return serialize_metric_event(event)


@router.get("/", response_model=list[MetricEventRead])
def get_events(
    event_type: str | None = Query(default=None),
    start_time: datetime | None = Query(default=None),
    end_time: datetime | None = Query(default=None),
    limit: int = Query(default=100, ge=1, le=500),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> list[MetricEventRead]:
    events = list_metric_events(
        db,
        user_id=user.id,
        event_type=event_type,
        start_time=start_time,
        end_time=end_time,
        limit=limit,
    )
    return [serialize_metric_event(event) for event in events]
