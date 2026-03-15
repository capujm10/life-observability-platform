from datetime import date, timedelta
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db_session
from app.models import Habit, HabitLog, User
from app.schemas.habit import HabitCreate, HabitLogCreate, HabitLogRead, HabitRead, HabitUpdate
from app.services.analytics import get_habit_consistency
from app.services.events import create_metric_event

router = APIRouter()


def get_habit_or_404(db: Session, habit_id: UUID, user_id: UUID) -> Habit:
    habit = db.scalar(select(Habit).where(Habit.id == habit_id, Habit.user_id == user_id))
    if habit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Habit not found.")
    return habit


def serialize_habit(habit: Habit, logs: list[HabitLog], current_streak: int) -> HabitRead:
    today = date.today()
    recent_logs = sorted(logs, key=lambda log: log.logged_on, reverse=True)[:7]
    return HabitRead(
        id=habit.id,
        user_id=habit.user_id,
        name=habit.name,
        description=habit.description,
        color=habit.color,
        target_frequency=habit.target_frequency,
        target_days_per_week=habit.target_days_per_week,
        is_active=habit.is_active,
        completed_today=any(log.completed and log.logged_on == today for log in logs),
        current_streak=current_streak,
        recent_logs=[HabitLogRead.model_validate(log) for log in recent_logs],
        created_at=habit.created_at,
        updated_at=habit.updated_at,
    )


@router.get("/", response_model=list[HabitRead])
def list_habits(
    active_only: bool = Query(default=False),
    days: int = Query(default=7, ge=1, le=30),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> list[HabitRead]:
    query = select(Habit).where(Habit.user_id == user.id)
    if active_only:
        query = query.where(Habit.is_active.is_(True))
    habits = db.scalars(query.order_by(Habit.created_at.asc())).all()
    habit_metrics, logs_lookup = get_habit_consistency(db, user.id, days)
    metrics_lookup = {metric.habit_id: metric for metric in habit_metrics}
    return [
        serialize_habit(habit, logs_lookup.get(habit.id, []), metrics_lookup.get(habit.id).current_streak if metrics_lookup.get(habit.id) else 0)
        for habit in habits
    ]


@router.post("/", response_model=HabitRead, status_code=status.HTTP_201_CREATED)
def create_habit(
    payload: HabitCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> HabitRead:
    habit = Habit(user_id=user.id, **payload.model_dump())
    db.add(habit)
    db.commit()
    db.refresh(habit)
    return serialize_habit(habit, [], 0)


@router.put("/{habit_id}", response_model=HabitRead)
def update_habit(
    habit_id: UUID,
    payload: HabitUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> HabitRead:
    habit = get_habit_or_404(db, habit_id, user.id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(habit, field, value)
    db.add(habit)
    db.commit()
    db.refresh(habit)
    logs = db.scalars(
        select(HabitLog).where(HabitLog.habit_id == habit.id, HabitLog.logged_on >= date.today() - timedelta(days=6))
    ).all()
    return serialize_habit(habit, logs, 0)


@router.post("/{habit_id}/logs", response_model=HabitRead)
def upsert_habit_log(
    habit_id: UUID,
    payload: HabitLogCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> HabitRead:
    habit = get_habit_or_404(db, habit_id, user.id)
    log_day = payload.logged_on or date.today()
    log = db.scalar(select(HabitLog).where(HabitLog.habit_id == habit.id, HabitLog.logged_on == log_day))
    is_new_log = log is None
    should_log_completion = payload.completed and (log is None or not log.completed)
    if log is None:
        log = HabitLog(habit_id=habit.id, logged_on=log_day, completed=payload.completed, notes=payload.notes)
    else:
        log.completed = payload.completed
        log.notes = payload.notes
    db.add(log)
    db.flush()
    if should_log_completion:
        create_metric_event(
            db,
            user_id=user.id,
            event_type="habit_completed",
            value=1.0,
            metadata={
                "habit_id": str(habit.id),
                "habit_name": habit.name,
                "logged_on": log.logged_on.isoformat(),
                "target_days_per_week": habit.target_days_per_week,
            },
            timestamp=log.created_at if is_new_log else log.updated_at,
        )
    db.commit()
    logs = db.scalars(
        select(HabitLog).where(HabitLog.habit_id == habit.id, HabitLog.logged_on >= date.today() - timedelta(days=13))
    ).all()
    streak = 0
    habit_metrics, _ = get_habit_consistency(db, user.id, 14)
    for metric in habit_metrics:
        if metric.habit_id == habit.id:
            streak = metric.current_streak
            break
    return serialize_habit(habit, logs, streak)


@router.delete("/{habit_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_habit(
    habit_id: UUID,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> None:
    habit = get_habit_or_404(db, habit_id, user.id)
    db.delete(habit)
    db.commit()
