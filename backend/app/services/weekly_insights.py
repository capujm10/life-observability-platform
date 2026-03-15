from datetime import date, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models import HabitLog, JournalEntry, Project, User
from app.schemas.weekly_insights import (
    JournalingFrequencyInsight,
    MostConsistentHabitInsight,
    ProductivityChangeInsight,
    ProjectActivityInsight,
    ProjectActivityProject,
    WeeklyCountComparison,
    WeeklyInsightsAggregate,
    WeeklyInsightsRead,
)
from app.services.analytics import get_habit_consistency, get_task_counts


def compute_percent_change(current: int, previous: int) -> float | None:
    if previous == 0:
        return 0.0 if current == 0 else None
    return round(((current - previous) / previous) * 100, 2)


def comparison(current: int, previous: int) -> WeeklyCountComparison:
    return WeeklyCountComparison(
        current_week=current,
        previous_week=previous,
        delta=current - previous,
        percent_change=compute_percent_change(current, previous),
    )


def direction_from_counts(current: int, previous: int) -> str:
    if current > previous:
        return "up"
    if current < previous:
        return "down"
    return "flat"


def count_completed_habits(db: Session, user: User, start_date: date, end_date: date) -> int:
    habit_ids = [habit.id for habit in user.habits]
    if not habit_ids:
        return 0

    logs = db.scalars(
        select(HabitLog).where(
            HabitLog.habit_id.in_(habit_ids),
            HabitLog.completed.is_(True),
            HabitLog.logged_on >= start_date,
            HabitLog.logged_on <= end_date,
        )
    ).all()
    return len(logs)


def get_journaling_frequency(
    db: Session,
    user_id,
    current_start: date,
    current_end: date,
    previous_start: date,
    previous_end: date,
) -> JournalingFrequencyInsight:
    entries = db.scalars(
        select(JournalEntry).where(
            JournalEntry.user_id == user_id,
            JournalEntry.entry_date >= previous_start,
            JournalEntry.entry_date <= current_end,
        )
    ).all()

    current_entries = [entry for entry in entries if current_start <= entry.entry_date <= current_end]
    previous_entries = [entry for entry in entries if previous_start <= entry.entry_date <= previous_end]

    active_days_current = len({entry.entry_date for entry in current_entries})
    active_days_previous = len({entry.entry_date for entry in previous_entries})

    return JournalingFrequencyInsight(
        current_week_entries=len(current_entries),
        previous_week_entries=len(previous_entries),
        active_days_current=active_days_current,
        active_days_previous=active_days_previous,
        average_entries_per_active_day=round(len(current_entries) / max(active_days_current, 1), 2),
        percent_change=compute_percent_change(len(current_entries), len(previous_entries)),
        direction=direction_from_counts(len(current_entries), len(previous_entries)),
    )


def get_project_activity(
    db: Session,
    user_id,
    current_start: date,
    current_end: date,
    previous_start: date,
    previous_end: date,
) -> ProjectActivityInsight:
    projects = db.scalars(
        select(Project)
        .where(Project.user_id == user_id)
        .options(selectinload(Project.updates))
        .order_by(Project.updated_at.desc())
    ).all()

    project_items: list[ProjectActivityProject] = []
    total_updates_current = 0
    total_updates_previous = 0
    active_projects_current = 0

    for project in projects:
        updates = sorted(list(project.updates), key=lambda update: update.created_at)
        current_updates = [
            update for update in updates if current_start <= update.created_at.date() <= current_end
        ]
        previous_updates = [
            update for update in updates if previous_start <= update.created_at.date() <= previous_end
        ]

        total_updates_current += len(current_updates)
        total_updates_previous += len(previous_updates)
        if current_updates:
            active_projects_current += 1

        baseline_progress = 0
        for update in reversed(updates):
            if update.created_at.date() < current_start:
                baseline_progress = update.progress_percentage
                break

        latest_progress = current_updates[-1].progress_percentage if current_updates else baseline_progress
        project_items.append(
            ProjectActivityProject(
                project_id=project.id,
                project_name=project.name,
                status=project.status,
                updates_current_week=len(current_updates),
                updates_previous_week=len(previous_updates),
                progress_change=latest_progress - baseline_progress,
                last_update_at=current_updates[-1].created_at if current_updates else None,
            )
        )

    most_active_project = None
    if project_items:
        most_active_project = max(
            project_items,
            key=lambda item: (item.updates_current_week, item.progress_change, item.project_name),
        )
        if most_active_project.updates_current_week == 0:
            most_active_project = None

    return ProjectActivityInsight(
        total_updates_current=total_updates_current,
        total_updates_previous=total_updates_previous,
        active_projects_current=active_projects_current,
        most_active_project=most_active_project,
        projects=project_items,
    )


def build_weekly_insights(db: Session, user: User, days: int) -> WeeklyInsightsRead:
    period_end = date.today()
    period_start = period_end - timedelta(days=days - 1)
    previous_period_start = period_start - timedelta(days)
    previous_period_end = period_start - timedelta(days=1)

    completed_tasks_current, _ = get_task_counts(db, user.id, period_start, period_end)
    completed_tasks_previous, _ = get_task_counts(db, user.id, previous_period_start, previous_period_end)

    habits_completed_current = count_completed_habits(db, user, period_start, period_end)
    habits_completed_previous = count_completed_habits(db, user, previous_period_start, previous_period_end)

    journaling = get_journaling_frequency(
        db,
        user.id,
        period_start,
        period_end,
        previous_period_start,
        previous_period_end,
    )

    project_activity = get_project_activity(
        db,
        user.id,
        period_start,
        period_end,
        previous_period_start,
        previous_period_end,
    )

    habit_items, _ = get_habit_consistency(db, user.id, days, period_end)
    most_consistent_habit = None
    if habit_items:
        best_habit = max(
            habit_items,
            key=lambda item: (item.completion_rate, item.completed_days, item.current_streak),
        )
        most_consistent_habit = MostConsistentHabitInsight(
            habit_id=best_habit.habit_id,
            habit_name=best_habit.habit_name,
            completion_rate=best_habit.completion_rate,
            completed_days=best_habit.completed_days,
            target_days=best_habit.target_days,
            current_streak=best_habit.current_streak,
        )

    aggregates = WeeklyInsightsAggregate(
        tasks_completed=comparison(completed_tasks_current, completed_tasks_previous),
        habits_completed=comparison(habits_completed_current, habits_completed_previous),
        journal_entries=comparison(
            journaling.current_week_entries,
            journaling.previous_week_entries,
        ),
        project_updates=comparison(
            project_activity.total_updates_current,
            project_activity.total_updates_previous,
        ),
    )

    current_total = (
        completed_tasks_current
        + habits_completed_current
        + journaling.current_week_entries
        + project_activity.total_updates_current
    )
    previous_total = (
        completed_tasks_previous
        + habits_completed_previous
        + journaling.previous_week_entries
        + project_activity.total_updates_previous
    )

    productivity_change = ProductivityChangeInsight(
        current_total=current_total,
        previous_total=previous_total,
        delta=current_total - previous_total,
        percent_change=compute_percent_change(current_total, previous_total),
        direction=direction_from_counts(current_total, previous_total),
    )

    return WeeklyInsightsRead(
        period_start=period_start,
        period_end=period_end,
        previous_period_start=previous_period_start,
        previous_period_end=previous_period_end,
        aggregates=aggregates,
        productivity_change=productivity_change,
        most_consistent_habit=most_consistent_habit,
        journaling_frequency=journaling,
        project_activity=project_activity,
    )
