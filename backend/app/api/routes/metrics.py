from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db_session
from app.models import User
from app.schemas.metrics import MetricsOverview
from app.services.analytics import build_metrics_overview

router = APIRouter()


@router.get("/overview", response_model=MetricsOverview)
def get_metrics_overview(
    days: int = Query(default=14, ge=7, le=90),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> MetricsOverview:
    return build_metrics_overview(db, user.id, days)

