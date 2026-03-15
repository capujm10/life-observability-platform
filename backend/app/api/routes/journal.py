from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db_session
from app.models import JournalEntry, User
from app.schemas.journal import JournalEntryCreate, JournalEntryRead, JournalEntryUpdate
from app.services.events import create_metric_event

router = APIRouter()


def get_entry_or_404(db: Session, entry_id: UUID, user_id: UUID) -> JournalEntry:
    entry = db.scalar(select(JournalEntry).where(JournalEntry.id == entry_id, JournalEntry.user_id == user_id))
    if entry is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Journal entry not found.")
    return entry


@router.get("/", response_model=list[JournalEntryRead])
def list_entries(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> list[JournalEntry]:
    return list(
        db.scalars(
            select(JournalEntry)
            .where(JournalEntry.user_id == user.id)
            .order_by(JournalEntry.entry_date.desc(), JournalEntry.created_at.desc())
        ).all()
    )


@router.post("/", response_model=JournalEntryRead, status_code=status.HTTP_201_CREATED)
def create_entry(
    payload: JournalEntryCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> JournalEntry:
    entry = JournalEntry(user_id=user.id, **payload.model_dump())
    db.add(entry)
    db.flush()
    create_metric_event(
        db,
        user_id=user.id,
        event_type="journal_entry_created",
        value=1.0,
        metadata={
            "journal_entry_id": str(entry.id),
            "title": entry.title,
            "entry_date": entry.entry_date.isoformat(),
            "mood_score": entry.mood_score,
            "focus_score": entry.focus_score,
        },
        timestamp=entry.created_at,
    )
    db.commit()
    db.refresh(entry)
    return entry


@router.put("/{entry_id}", response_model=JournalEntryRead)
def update_entry(
    entry_id: UUID,
    payload: JournalEntryUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> JournalEntry:
    entry = get_entry_or_404(db, entry_id, user.id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(entry, field, value)
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_entry(
    entry_id: UUID,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> None:
    entry = get_entry_or_404(db, entry_id, user.id)
    db.delete(entry)
    db.commit()
