from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db_session
from app.models import User
from app.schemas.weekly_insights import WeeklyInsightsRead
from app.services.weekly_insights import build_weekly_insights

router = APIRouter()


@router.get("/", response_model=WeeklyInsightsRead)
def get_weekly_insights(
    days: int = Query(default=7, ge=7, le=28),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> WeeklyInsightsRead:
    return build_weekly_insights(db, user, days)
