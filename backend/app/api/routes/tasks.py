from datetime import UTC, datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db_session
from app.models import Task, User
from app.models.enums import TaskPriority, TaskStatus
from app.schemas.task import TaskCreate, TaskRead, TaskUpdate
from app.services.events import create_metric_event

router = APIRouter()


def get_task_or_404(db: Session, task_id: UUID, user_id: UUID) -> Task:
    task = db.scalar(select(Task).where(Task.id == task_id, Task.user_id == user_id))
    if task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found.")
    return task


@router.get("/", response_model=list[TaskRead])
def list_tasks(
    search: str | None = Query(default=None),
    task_status: TaskStatus | None = Query(default=None, alias="status"),
    priority: TaskPriority | None = Query(default=None),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> list[Task]:
    query = select(Task).where(Task.user_id == user.id)
    if search:
        pattern = f"%{search.strip()}%"
        query = query.where(or_(Task.title.ilike(pattern), Task.description.ilike(pattern)))
    if task_status:
        query = query.where(Task.status == task_status)
    if priority:
        query = query.where(Task.priority == priority)
    query = query.order_by(Task.due_date.is_(None), Task.due_date.asc(), Task.created_at.desc())
    return list(db.scalars(query).all())


@router.post("/", response_model=TaskRead, status_code=status.HTTP_201_CREATED)
def create_task(
    payload: TaskCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> Task:
    task = Task(user_id=user.id, **payload.model_dump())
    if task.status == TaskStatus.done:
        task.completed_at = datetime.now(UTC)
    db.add(task)
    db.flush()
    if task.completed_at is not None:
        create_metric_event(
            db,
            user_id=user.id,
            event_type="task_completed",
            value=1.0,
            metadata={
                "task_id": str(task.id),
                "title": task.title,
                "priority": task.priority.value,
                "focus_minutes": task.focus_minutes,
                "estimated_minutes": task.estimated_minutes,
            },
            timestamp=task.completed_at,
        )
    db.commit()
    db.refresh(task)
    return task


@router.put("/{task_id}", response_model=TaskRead)
def update_task(
    task_id: UUID,
    payload: TaskUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> Task:
    task = get_task_or_404(db, task_id, user.id)
    was_completed = task.completed_at is not None or task.status == TaskStatus.done
    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(task, field, value)
    if task.status == TaskStatus.done and task.completed_at is None:
        task.completed_at = datetime.now(UTC)
    just_completed = task.status == TaskStatus.done and not was_completed and task.completed_at is not None
    if task.status != TaskStatus.done:
        task.completed_at = None
    db.add(task)
    db.flush()
    if just_completed:
        create_metric_event(
            db,
            user_id=user.id,
            event_type="task_completed",
            value=1.0,
            metadata={
                "task_id": str(task.id),
                "title": task.title,
                "priority": task.priority.value,
                "focus_minutes": task.focus_minutes,
                "estimated_minutes": task.estimated_minutes,
            },
            timestamp=task.completed_at,
        )
    db.commit()
    db.refresh(task)
    return task


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: UUID,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> None:
    task = get_task_or_404(db, task_id, user.id)
    db.delete(task)
    db.commit()
