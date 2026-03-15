from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.api.deps import get_current_user
from app.core.database import get_db_session
from app.models import Project, ProjectUpdate as ProjectUpdateModel, User
from app.schemas.project import ProjectCreate, ProjectRead, ProjectUpdate, ProjectUpdateCreate
from app.services.events import create_metric_event

router = APIRouter()


def get_project_or_404(db: Session, project_id: UUID, user_id: UUID) -> Project:
    project = db.scalar(
        select(Project)
        .where(Project.id == project_id, Project.user_id == user_id)
        .options(selectinload(Project.updates))
    )
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found.")
    return project


@router.get("/", response_model=list[ProjectRead])
def list_projects(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> list[Project]:
    return list(
        db.scalars(
            select(Project)
            .where(Project.user_id == user.id)
            .options(selectinload(Project.updates))
            .order_by(Project.updated_at.desc())
        ).all()
    )


@router.post("/", response_model=ProjectRead, status_code=status.HTTP_201_CREATED)
def create_project(
    payload: ProjectCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> Project:
    project_data = payload.model_dump(exclude={"initial_update"})
    project = Project(user_id=user.id, **project_data)
    db.add(project)
    db.flush()
    if payload.initial_update:
        db.add(
            ProjectUpdateModel(
                project_id=project.id,
                content=payload.initial_update,
                progress_percentage=project.progress_percentage,
            )
        )
    db.commit()
    db.refresh(project)
    return get_project_or_404(db, project.id, user.id)


@router.put("/{project_id}", response_model=ProjectRead)
def update_project(
    project_id: UUID,
    payload: ProjectUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> Project:
    project = get_project_or_404(db, project_id, user.id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(project, field, value)
    db.add(project)
    db.commit()
    return get_project_or_404(db, project.id, user.id)


@router.post("/{project_id}/updates", response_model=ProjectRead)
def add_project_update(
    project_id: UUID,
    payload: ProjectUpdateCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> Project:
    project = get_project_or_404(db, project_id, user.id)
    previous_progress = project.progress_percentage
    project.progress_percentage = payload.progress_percentage
    db.add(project)
    update = ProjectUpdateModel(
        project_id=project.id,
        content=payload.content,
        progress_percentage=payload.progress_percentage,
    )
    db.add(update)
    db.flush()
    create_metric_event(
        db,
        user_id=user.id,
        event_type="project_progress_update",
        value=float(payload.progress_percentage),
        metadata={
            "project_id": str(project.id),
            "project_name": project.name,
            "previous_progress_percentage": previous_progress,
            "progress_percentage": payload.progress_percentage,
            "progress_delta": payload.progress_percentage - previous_progress,
            "update_id": str(update.id),
        },
        timestamp=update.created_at,
    )
    db.commit()
    return get_project_or_404(db, project.id, user.id)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: UUID,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> None:
    project = get_project_or_404(db, project_id, user.id)
    db.delete(project)
    db.commit()
