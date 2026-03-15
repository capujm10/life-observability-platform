from app.models.enums import ThemePreference
from app.schemas.common import ORMModel


class SettingsRead(ORMModel):
    email: str
    full_name: str
    timezone: str
    theme_preference: ThemePreference
    weekly_focus_goal_minutes: int


class SettingsUpdate(ORMModel):
    full_name: str | None = None
    timezone: str | None = None
    theme_preference: ThemePreference | None = None
    weekly_focus_goal_minutes: int | None = None

