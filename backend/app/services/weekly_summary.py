from datetime import date, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Project, Task, User
from app.models.enums import ProjectStatus, TaskStatus
from app.schemas.weekly_summary import HabitHighlight, ProjectMovement, WeeklySummaryRead
from app.services.analytics import build_metrics_overview, get_habit_consistency, get_task_counts


def build_weekly_summary(db: Session, user: User, days: int) -> WeeklySummaryRead:
    period_end = date.today()
    period_start = period_end - timedelta(days=days - 1)
    previous_start = period_start - timedelta(days=days)
    previous_end = period_start - timedelta(days=1)

    metrics = build_metrics_overview(db, user.id, days)
    completed_tasks, created_tasks = get_task_counts(db, user.id, period_start, period_end)
    previous_completed_tasks, _ = get_task_counts(db, user.id, previous_start, previous_end)
    habit_items, _ = get_habit_consistency(db, user.id, days, period_end)
    average_habit_completion = round(
        sum(item.completion_rate for item in habit_items) / max(len(habit_items), 1),
        2,
    )

    projects = db.scalars(select(Project).where(Project.user_id == user.id).order_by(Project.updated_at.desc())).all()
    project_movements: list[ProjectMovement] = []
    for project in projects:
        relevant_updates = [update for update in project.updates if update.created_at.date() < period_start]
        baseline_progress = relevant_updates[0].progress_percentage if relevant_updates else 0
        project_movements.append(
            ProjectMovement(
                project_id=project.id,
                project_name=project.name,
                status=project.status,
                progress_percentage=project.progress_percentage,
                progress_change=project.progress_percentage - baseline_progress,
            )
        )

    overdue_tasks = db.scalars(
        select(Task).where(
            Task.user_id == user.id,
            Task.status != TaskStatus.done,
            Task.due_date.is_not(None),
            Task.due_date < period_end,
        )
    ).all()
    at_risk_projects = [project for project in projects if project.status == ProjectStatus.at_risk]
    wins = [
        f"Completed {completed_tasks} tasks, {completed_tasks - previous_completed_tasks:+d} versus the prior {days}-day window.",
        f"Logged {metrics.summary.total_focus_minutes} focus minutes across the last {days} days.",
    ]
    if habit_items:
        best_habit = max(habit_items, key=lambda item: (item.completion_rate, item.current_streak))
        wins.append(
            f"Best habit trend: {best_habit.habit_name} at {int(best_habit.completion_rate * 100)}% consistency with a {best_habit.current_streak}-day streak."
        )

    risks: list[str] = []
    if overdue_tasks:
        risks.append(f"{len(overdue_tasks)} task(s) are overdue and should be re-planned.")
    if at_risk_projects:
        risks.append(f"{len(at_risk_projects)} project(s) are flagged at risk and need scope or timeline review.")
    if not risks:
        risks.append("No major blockers were detected from the stored data this week.")

    next_focus = [
        "Close or reschedule overdue tasks before adding new commitments.",
        "Protect at least two high-focus blocks on the calendar for the next week.",
        "Write one journal entry after the highest-leverage work session each day.",
    ]

    return WeeklySummaryRead(
        period_start=period_start,
        period_end=period_end,
        completed_tasks=completed_tasks,
        tasks_created=created_tasks,
        focus_minutes=metrics.summary.total_focus_minutes,
        journal_entries=metrics.summary.journal_entries_logged,
        habit_completion_rate=average_habit_completion,
        wins=wins,
        risks=risks,
        next_focus=next_focus,
        daily_focus=metrics.focus_time,
        habit_highlights=[
            HabitHighlight(
                habit_id=item.habit_id,
                habit_name=item.habit_name,
                completion_rate=item.completion_rate,
                current_streak=item.current_streak,
            )
            for item in sorted(habit_items, key=lambda habit: habit.completion_rate, reverse=True)[:3]
        ],
        project_movements=project_movements[:4],
    )

