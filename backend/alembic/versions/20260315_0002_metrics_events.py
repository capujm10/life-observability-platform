"""Add generic metrics events table."""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "20260315_0002"
down_revision = "20260315_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "metrics_events",
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("event_type", sa.String(length=120), nullable=False),
        sa.Column("value", sa.Float(), nullable=False),
        sa.Column(
            "metadata",
            sa.JSON().with_variant(postgresql.JSONB(astext_type=sa.Text()), "postgresql"),
            nullable=False,
        ),
        sa.Column("timestamp", sa.DateTime(timezone=True), nullable=False),
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_metrics_events_event_type"), "metrics_events", ["event_type"], unique=False)
    op.create_index(op.f("ix_metrics_events_timestamp"), "metrics_events", ["timestamp"], unique=False)
    op.create_index(op.f("ix_metrics_events_user_id"), "metrics_events", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_metrics_events_user_id"), table_name="metrics_events")
    op.drop_index(op.f("ix_metrics_events_timestamp"), table_name="metrics_events")
    op.drop_index(op.f("ix_metrics_events_event_type"), table_name="metrics_events")
    op.drop_table("metrics_events")

