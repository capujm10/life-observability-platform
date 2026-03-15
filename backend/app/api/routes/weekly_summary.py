from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db_session
from app.models import User
from app.schemas.weekly_summary import WeeklySummaryRead
from app.services.weekly_summary import build_weekly_summary

router = APIRouter()


@router.get("/current", response_model=WeeklySummaryRead)
def get_current_summary(
    days: int = Query(default=7, ge=7, le=28),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> WeeklySummaryRead:
    return build_weekly_summary(db, user, days)

