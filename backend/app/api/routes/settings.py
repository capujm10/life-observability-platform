from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db_session
from app.models import User
from app.schemas.settings import SettingsRead, SettingsUpdate

router = APIRouter()


@router.get("/", response_model=SettingsRead)
def get_settings_view(user: User = Depends(get_current_user)) -> SettingsRead:
    return SettingsRead.model_validate(user)


@router.put("/", response_model=SettingsRead)
def update_settings_view(
    payload: SettingsUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> SettingsRead:
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(user, field, value)
    db.add(user)
    db.commit()
    db.refresh(user)
    return SettingsRead.model_validate(user)

