from uuid import UUID

from app.models.enums import ThemePreference
from app.schemas.common import ORMModel


class LoginRequest(ORMModel):
    email: str
    password: str


class UserRead(ORMModel):
    id: UUID
    email: str
    full_name: str
    timezone: str
    theme_preference: ThemePreference
    weekly_focus_goal_minutes: int


class TokenResponse(ORMModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead
