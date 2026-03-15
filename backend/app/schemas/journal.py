from datetime import date
from uuid import UUID

from app.schemas.common import ORMModel, TimestampedModel


class JournalEntryBase(ORMModel):
    title: str
    content: str
    entry_date: date
    mood_score: int | None = None
    focus_score: int | None = None


class JournalEntryCreate(JournalEntryBase):
    pass


class JournalEntryUpdate(ORMModel):
    title: str | None = None
    content: str | None = None
    entry_date: date | None = None
    mood_score: int | None = None
    focus_score: int | None = None


class JournalEntryRead(TimestampedModel):
    user_id: UUID
    title: str
    content: str
    entry_date: date
    mood_score: int | None
    focus_score: int | None

