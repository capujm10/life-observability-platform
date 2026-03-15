from sqlalchemy import Enum as SqlEnum
from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import ThemePreference
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class User(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(255))
    password_hash: Mapped[str] = mapped_column(String(255))
    timezone: Mapped[str] = mapped_column(String(64), default="America/Costa_Rica")
    theme_preference: Mapped[ThemePreference] = mapped_column(
        SqlEnum(ThemePreference, native_enum=False),
        default=ThemePreference.system,
    )
    weekly_focus_goal_minutes: Mapped[int] = mapped_column(Integer, default=600)

    tasks = relationship("Task", back_populates="user", cascade="all, delete-orphan")
    habits = relationship("Habit", back_populates="user", cascade="all, delete-orphan")
    journal_entries = relationship("JournalEntry", back_populates="user", cascade="all, delete-orphan")
    projects = relationship("Project", back_populates="user", cascade="all, delete-orphan")
    metric_events = relationship("MetricEvent", back_populates="user", cascade="all, delete-orphan")
    metric_snapshots = relationship("MetricSnapshot", back_populates="user", cascade="all, delete-orphan")
