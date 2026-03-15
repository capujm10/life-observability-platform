import uuid
from datetime import date, datetime

from sqlalchemy import JSON, Date, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.mixins import TimestampMixin, UUIDPrimaryKeyMixin, utcnow


class MetricSnapshot(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "metrics_snapshots"
    __table_args__ = (UniqueConstraint("user_id", "snapshot_date", name="uq_metric_snapshot_user_day"),)

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    snapshot_date: Mapped[date] = mapped_column(Date, index=True)
    focus_minutes: Mapped[int] = mapped_column(Integer, default=0)
    energy_level: Mapped[int] = mapped_column(Integer, nullable=True)
    deep_work_blocks: Mapped[int] = mapped_column(Integer, default=0)
    notes: Mapped[str] = mapped_column(Text, nullable=True)

    user = relationship("User", back_populates="metric_snapshots")


class MetricEvent(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "metrics_events"

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    event_type: Mapped[str] = mapped_column(String(120), index=True)
    value: Mapped[float] = mapped_column(Float, default=1.0)
    event_metadata: Mapped[dict] = mapped_column(
        "metadata",
        JSON().with_variant(JSONB, "postgresql"),
        default=dict,
    )
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, index=True)

    user = relationship("User", back_populates="metric_events")
