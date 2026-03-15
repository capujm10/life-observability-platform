from collections import defaultdict
from datetime import date, timedelta
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models import Habit, HabitLog, JournalEntry, MetricSnapshot, Project, Task
from app.schemas.metrics import (
    HabitConsistencyItem,
    HabitHeatmapCell,
    HabitHeatmapRow,
    MetricsOverview,
    MetricsSummary,
    ProjectProgressItem,
    ProjectVelocityItem,
    TimeSeriesPoint,
)


def iter_day_range(start_date: date, end_date: date) -> list[date]:
    return [start_date + timedelta(days=offset) for offset in range((end_date - start_date).days + 1)]


def build_time_series(values_by_date: dict[date, int], start_date: date, end_date: date) -> list[TimeSeriesPoint]:
    series: list[TimeSeriesPoint] = []
    for day in iter_day_range(start_date, end_date):
        series.append(
            TimeSeriesPoint(
                date=day.isoformat(),
                label=day.strftime("%a"),
                value=values_by_date.get(day, 0),
            )
        )
    return series


def calculate_streak(completed_days: set[date], reference_day: date) -> int:
    streak = 0
    cursor = reference_day
    while cursor in completed_days:
        streak += 1
        cursor -= timedelta(days=1)
    return streak


def get_focus_time_series(db: Session, user_id: UUID, days: int, end_date: date | None = None) -> list[TimeSeriesPoint]:
    final_day = end_date or date.today()
    start_date = final_day - timedelta(days=days - 1)
    snapshots = db.scalars(
        select(MetricSnapshot).where(
            MetricSnapshot.user_id == user_id,
            MetricSnapshot.snapshot_date >= start_date,
            MetricSnapshot.snapshot_date <= final_day,
        )
    ).all()
    values = {snapshot.snapshot_date: snapshot.focus_minutes for snapshot in snapshots}
    return build_time_series(values, start_date, final_day)


def get_journal_frequency_series(db: Session, user_id: UUID, days: int, end_date: date | None = None) -> list[TimeSeriesPoint]:
    final_day = end_date or date.today()
    start_date = final_day - timedelta(days=days - 1)
    entries = db.scalars(
        select(JournalEntry).where(
            JournalEntry.user_id == user_id,
            JournalEntry.entry_date >= start_date,
            JournalEntry.entry_date <= final_day,
        )
    ).all()
    values: dict[date, int] = defaultdict(int)
    for entry in entries:
        values[entry.entry_date] += 1
    return build_time_series(dict(values), start_date, final_day)


def get_task_completion_series(
    db: Session,
    user_id: UUID,
    days: int,
    end_date: date | None = None,
) -> list[TimeSeriesPoint]:
    final_day = end_date or date.today()
    start_date = final_day - timedelta(days=days - 1)
    tasks = db.scalars(
        select(Task).where(
            Task.user_id == user_id,
            Task.completed_at.is_not(None),
        )
    ).all()
    values: dict[date, int] = defaultdict(int)
    for task in tasks:
        if task.completed_at is None:
            continue
        completed_day = task.completed_at.date()
        if start_date <= completed_day <= final_day:
            values[completed_day] += 1
    return build_time_series(dict(values), start_date, final_day)


def get_habit_logs_lookup(
    db: Session,
    habit_ids: list[UUID],
    start_date: date,
    end_date: date,
) -> dict[UUID, list[HabitLog]]:
    if not habit_ids:
        return {}
    logs = db.scalars(
        select(HabitLog).where(
            HabitLog.habit_id.in_(habit_ids),
            HabitLog.logged_on >= start_date,
            HabitLog.logged_on <= end_date,
        )
    ).all()
    lookup: dict[UUID, list[HabitLog]] = defaultdict(list)
    for log in logs:
        lookup[log.habit_id].append(log)
    return lookup


def get_habit_consistency(
    db: Session,
    user_id: UUID,
    days: int,
    end_date: date | None = None,
) -> tuple[list[HabitConsistencyItem], dict[UUID, list[HabitLog]]]:
    final_day = end_date or date.today()
    start_date = final_day - timedelta(days=days - 1)
    habits = db.scalars(select(Habit).where(Habit.user_id == user_id).order_by(Habit.created_at.asc())).all()
    habit_ids = [habit.id for habit in habits]
    logs_lookup = get_habit_logs_lookup(db, habit_ids, start_date, final_day)

    items: list[HabitConsistencyItem] = []
    for habit in habits:
        logs = logs_lookup.get(habit.id, [])
        completed_days = {log.logged_on for log in logs if log.completed}
        target_days = min(days, habit.target_days_per_week)
        completion_rate = round(len(completed_days) / max(target_days, 1), 2)
        items.append(
            HabitConsistencyItem(
                habit_id=habit.id,
                habit_name=habit.name,
                color=habit.color,
                completion_rate=completion_rate,
                completed_days=len(completed_days),
                target_days=target_days,
                current_streak=calculate_streak(completed_days, final_day),
            )
        )

    return items, logs_lookup


def get_project_progress(db: Session, user_id: UUID) -> list[ProjectProgressItem]:
    projects = db.scalars(
        select(Project)
        .where(Project.user_id == user_id)
        .options(selectinload(Project.updates))
        .order_by(Project.updated_at.desc())
    ).all()
    results: list[ProjectProgressItem] = []
    for project in projects:
        trend = [
            TimeSeriesPoint(
                date=update.created_at.date().isoformat(),
                label=update.created_at.strftime("%b %d"),
                value=update.progress_percentage,
            )
            for update in list(project.updates)[:4]
        ]
        if not trend:
            trend = [
                TimeSeriesPoint(
                    date=project.updated_at.date().isoformat(),
                    label=project.updated_at.strftime("%b %d"),
                    value=project.progress_percentage,
                )
            ]
        results.append(
            ProjectProgressItem(
                project_id=project.id,
                project_name=project.name,
                status=project.status,
                progress_percentage=project.progress_percentage,
                trend=list(reversed(trend)),
            )
        )
    return results


def get_habit_heatmap(
    db: Session,
    user_id: UUID,
    days: int,
    end_date: date | None = None,
) -> list[HabitHeatmapRow]:
    final_day = end_date or date.today()
    start_date = final_day - timedelta(days=days - 1)
    habits = db.scalars(select(Habit).where(Habit.user_id == user_id).order_by(Habit.created_at.asc())).all()
    logs_lookup = get_habit_logs_lookup(db, [habit.id for habit in habits], start_date, final_day)

    rows: list[HabitHeatmapRow] = []
    for habit in habits:
        completed_days = {log.logged_on for log in logs_lookup.get(habit.id, []) if log.completed}
        rows.append(
            HabitHeatmapRow(
                habit_id=habit.id,
                habit_name=habit.name,
                color=habit.color,
                cells=[
                    HabitHeatmapCell(
                        date=day.isoformat(),
                        label=day.strftime("%a"),
                        completed=day in completed_days,
                        intensity=1.0 if day in completed_days else 0.08,
                    )
                    for day in iter_day_range(start_date, final_day)
                ],
            )
        )
    return rows


def get_project_velocity(
    db: Session,
    user_id: UUID,
    days: int,
    end_date: date | None = None,
) -> list[ProjectVelocityItem]:
    final_day = end_date or date.today()
    start_date = final_day - timedelta(days=days - 1)
    projects = db.scalars(
        select(Project)
        .where(Project.user_id == user_id)
        .options(selectinload(Project.updates))
        .order_by(Project.updated_at.desc())
    ).all()

    velocities: list[ProjectVelocityItem] = []
    for project in projects:
        updates = sorted(list(project.updates), key=lambda item: item.created_at)
        relevant_updates = [update for update in updates if start_date <= update.created_at.date() <= final_day]
        baseline_progress = 0
        baseline_date = start_date

        for update in reversed(updates):
            if update.created_at.date() < start_date:
                baseline_progress = update.progress_percentage
                baseline_date = update.created_at.date()
                break

        if relevant_updates:
            latest_update = relevant_updates[-1]
            delta = latest_update.progress_percentage - baseline_progress
            elapsed_days = max((latest_update.created_at.date() - baseline_date).days, 1)
            velocity = round(delta / elapsed_days, 2)
            updates_in_window = len(relevant_updates)
        else:
            delta = 0
            velocity = 0.0
            updates_in_window = 0

        velocities.append(
            ProjectVelocityItem(
                project_id=project.id,
                project_name=project.name,
                status=project.status,
                current_progress_percentage=project.progress_percentage,
                velocity=velocity,
                progress_delta=delta,
                updates_in_window=updates_in_window,
            )
        )
    return velocities


def build_metrics_overview(db: Session, user_id: UUID, days: int) -> MetricsOverview:
    focus_series = get_focus_time_series(db, user_id, days)
    task_completion_series = get_task_completion_series(db, user_id, days)
    journal_series = get_journal_frequency_series(db, user_id, days)
    habits, _ = get_habit_consistency(db, user_id, days)
    habit_heatmap = get_habit_heatmap(db, user_id, days)
    projects = get_project_progress(db, user_id)
    project_velocity = get_project_velocity(db, user_id, days)
    total_focus = sum(point.value for point in focus_series)
    total_tasks_completed = sum(point.value for point in task_completion_series)
    total_journal_entries = sum(point.value for point in journal_series)
    average_habit_completion_rate = round(
        sum(habit.completion_rate for habit in habits) / max(len(habits), 1),
        2,
    )
    return MetricsOverview(
        focus_time=focus_series,
        task_completion_trend=task_completion_series,
        journal_frequency=journal_series,
        journal_activity_timeline=journal_series,
        habit_consistency=habits,
        habit_consistency_heatmap=habit_heatmap,
        project_progress=projects,
        project_progress_velocity=project_velocity,
        summary=MetricsSummary(
            total_focus_minutes=total_focus,
            average_daily_focus_minutes=round(total_focus / max(len(focus_series), 1)),
            journal_entries_logged=total_journal_entries,
            average_habit_completion_rate=average_habit_completion_rate,
            tasks_completed=total_tasks_completed,
        ),
    )


def get_task_counts(db: Session, user_id: UUID, start_date: date, end_date: date) -> tuple[int, int]:
    tasks = db.scalars(select(Task).where(Task.user_id == user_id)).all()
    completed = sum(
        1
        for task in tasks
        if task.completed_at and start_date <= task.completed_at.date() <= end_date
    )
    created = sum(1 for task in tasks if start_date <= task.created_at.date() <= end_date)
    return completed, created
