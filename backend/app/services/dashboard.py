from datetime import date, timedelta
from sqlalchemy import and_, func, or_, select
from sqlalchemy.orm import Session

from app.models import Habit, JournalEntry, MetricSnapshot, Project, Task, User
from app.models.enums import ProjectStatus, TaskStatus
from app.schemas.auth import UserRead
from app.schemas.dashboard import DashboardHabitItem, DashboardOverview, DashboardProjectItem, DashboardStats, DashboardTaskItem
from app.services.analytics import get_habit_consistency, get_task_counts


def build_dashboard_overview(db: Session, user: User) -> DashboardOverview:
    today = date.today()
    start_date = today - timedelta(days=6)
    completed_tasks_week, _ = get_task_counts(db, user.id, start_date, today)
    open_tasks = db.scalar(
        select(func.count(Task.id)).where(Task.user_id == user.id, Task.status != TaskStatus.done)
    ) or 0
    journal_entries_week = db.scalar(
        select(func.count(JournalEntry.id)).where(
            JournalEntry.user_id == user.id,
            JournalEntry.entry_date >= start_date,
            JournalEntry.entry_date <= today,
        )
    ) or 0
    active_projects_count = db.scalar(
        select(func.count(Project.id)).where(
            Project.user_id == user.id,
            Project.status.in_([ProjectStatus.active, ProjectStatus.at_risk]),
        )
    ) or 0
    focus_minutes_week = db.scalar(
        select(func.coalesce(func.sum(MetricSnapshot.focus_minutes), 0)).where(
            MetricSnapshot.user_id == user.id,
            MetricSnapshot.snapshot_date >= start_date,
            MetricSnapshot.snapshot_date <= today,
        )
    ) or 0

    habit_items, logs_lookup = get_habit_consistency(db, user.id, 7, today)
    habits = db.scalars(select(Habit).where(Habit.user_id == user.id, Habit.is_active.is_(True))).all()

    upcoming_tasks = db.scalars(
        select(Task).where(
            Task.user_id == user.id,
            Task.status != TaskStatus.done,
            or_(
                Task.due_date.is_(None),
                and_(Task.due_date >= today, Task.due_date <= today + timedelta(days=7)),
            ),
        ).order_by(Task.due_date.is_(None), Task.due_date.asc(), Task.created_at.desc())
    ).all()[:5]

    active_projects = db.scalars(
        select(Project)
        .where(Project.user_id == user.id, Project.status != ProjectStatus.completed)
        .order_by(Project.updated_at.desc())
    ).all()[:4]

    habit_completion_rate = round(
        sum(item.completion_rate for item in habit_items) / max(len(habit_items), 1),
        2,
    )
    habit_metrics_by_id = {item.habit_id: item for item in habit_items}
    todays_habits = []
    for habit in habits[:5]:
        metrics = habit_metrics_by_id.get(habit.id)
        completed_today = any(log.completed and log.logged_on == today for log in logs_lookup.get(habit.id, []))
        todays_habits.append(
            DashboardHabitItem(
                id=habit.id,
                name=habit.name,
                color=habit.color,
                completed_today=completed_today,
                current_streak=metrics.current_streak if metrics else 0,
                target_days_per_week=habit.target_days_per_week,
            )
        )

    return DashboardOverview(
        user=UserRead.model_validate(user),
        stats=DashboardStats(
            open_tasks=open_tasks,
            completed_tasks_week=completed_tasks_week,
            habit_completion_rate=habit_completion_rate,
            journal_entries_week=journal_entries_week,
            active_projects=active_projects_count,
            focus_minutes_week=focus_minutes_week,
        ),
        upcoming_tasks=[
            DashboardTaskItem(
                id=task.id,
                title=task.title,
                status=task.status,
                priority=task.priority,
                due_date=task.due_date,
            )
            for task in upcoming_tasks
        ],
        todays_habits=todays_habits,
        active_projects=[
            DashboardProjectItem(
                id=project.id,
                name=project.name,
                status=project.status,
                progress_percentage=project.progress_percentage,
                target_date=project.target_date,
            )
            for project in active_projects
        ],
        journal_prompt="What created momentum today, and what deserves more attention next week?",
    )
