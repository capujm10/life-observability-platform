from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db_session
from app.models import User
from app.schemas.dashboard import DashboardOverview
from app.services.dashboard import build_dashboard_overview

router = APIRouter()


@router.get("/overview", response_model=DashboardOverview)
def get_dashboard_overview(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> DashboardOverview:
    return build_dashboard_overview(db, user)

