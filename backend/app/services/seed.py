from datetime import UTC, date, datetime, time, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models import Habit, HabitLog, JournalEntry, MetricSnapshot, Project, ProjectUpdate, Task, User
from app.models.enums import HabitFrequency, ProjectStatus, TaskPriority, TaskStatus, ThemePreference
from app.services.events import create_metric_event


def seed_demo_data(db: Session, demo_user_email: str, demo_user_password: str) -> None:
    existing_user = db.scalar(select(User).where(User.email == demo_user_email))
    if existing_user:
        return

    today = date.today()
    user = User(
        email=demo_user_email,
        full_name="Demo Operator",
        password_hash=hash_password(demo_user_password),
        timezone="America/Costa_Rica",
        theme_preference=ThemePreference.system,
        weekly_focus_goal_minutes=720,
    )
    db.add(user)
    db.flush()

    tasks = [
        Task(
            user_id=user.id,
            title="Review weekly metrics",
            description="Inspect focus trends and decide what to adjust next week.",
            category="Planning",
            status=TaskStatus.in_progress,
            priority=TaskPriority.high,
            due_date=today + timedelta(days=1),
            estimated_minutes=45,
            focus_minutes=25,
        ),
        Task(
            user_id=user.id,
            title="Refactor onboarding copy",
            description="Tighten the first-run experience for the platform.",
            category="Product",
            status=TaskStatus.todo,
            priority=TaskPriority.medium,
            due_date=today + timedelta(days=3),
            estimated_minutes=90,
            focus_minutes=0,
        ),
        Task(
            user_id=user.id,
            title="Ship habit tracking MVP",
            description="Close the loop on habit create, edit, and completion logging.",
            category="Execution",
            status=TaskStatus.done,
            priority=TaskPriority.high,
            due_date=today - timedelta(days=2),
            estimated_minutes=120,
            focus_minutes=110,
        ),
        Task(
            user_id=user.id,
            title="Inbox zero for personal ops",
            description="Archive or schedule lingering items from last week.",
            category="Admin",
            status=TaskStatus.done,
            priority=TaskPriority.low,
            due_date=today - timedelta(days=1),
            estimated_minutes=30,
            focus_minutes=20,
        ),
        Task(
            user_id=user.id,
            title="Plan Q2 learning sprint",
            description="Scope topics, milestones, and calendar slots.",
            category="Growth",
            status=TaskStatus.todo,
            priority=TaskPriority.medium,
            due_date=today + timedelta(days=5),
            estimated_minutes=60,
            focus_minutes=0,
        ),
    ]
    db.add_all(tasks)
    db.flush()
    tasks[2].completed_at = tasks[2].created_at
    tasks[3].completed_at = tasks[3].created_at
    for task in [tasks[2], tasks[3]]:
        event_date = task.due_date or today
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
            timestamp=datetime.combine(event_date, time(hour=17), tzinfo=UTC),
        )

    habits = [
        Habit(
            user_id=user.id,
            name="Deep work",
            description="Protect at least one focused session.",
            color="#0f766e",
            target_frequency=HabitFrequency.daily,
            target_days_per_week=5,
        ),
        Habit(
            user_id=user.id,
            name="Workout",
            description="30 minutes minimum.",
            color="#ea580c",
            target_frequency=HabitFrequency.daily,
            target_days_per_week=4,
        ),
        Habit(
            user_id=user.id,
            name="Reflect",
            description="Write a quick check-in at the end of the day.",
            color="#2563eb",
            target_frequency=HabitFrequency.daily,
            target_days_per_week=6,
        ),
    ]
    db.add_all(habits)
    db.flush()

    for offset in range(21):
        day = today - timedelta(days=offset)
        db.add(
            MetricSnapshot(
                user_id=user.id,
                snapshot_date=day,
                focus_minutes=max(30, 150 - (offset % 6) * 18),
                energy_level=3 + (offset % 3),
                deep_work_blocks=1 + (offset % 3),
                notes="Seeded demo snapshot",
            )
        )

        if offset % 2 == 0:
            entry = JournalEntry(
                user_id=user.id,
                title=f"Daily reflection {day.strftime('%b %d')}",
                content="Captured wins, friction, and next actions.",
                entry_date=day,
                mood_score=4,
                focus_score=4,
            )
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
                timestamp=datetime.combine(day, time(hour=20), tzinfo=UTC),
            )

    habit_patterns = {
        habits[0].id: {0, 1, 2, 4, 6, 7, 9, 11, 13, 14, 16, 18, 20},
        habits[1].id: {0, 2, 4, 5, 8, 10, 12, 15, 17, 19},
        habits[2].id: {0, 1, 3, 4, 5, 7, 8, 10, 11, 14, 15, 18, 20},
    }
    for habit in habits:
        for offset in range(21):
            if offset in habit_patterns[habit.id]:
                logged_on = today - timedelta(days=offset)
                log = HabitLog(
                    habit_id=habit.id,
                    logged_on=logged_on,
                    completed=True,
                    notes="Seeded demo log",
                )
                db.add(log)
                db.flush()
                create_metric_event(
                    db,
                    user_id=user.id,
                    event_type="habit_completed",
                    value=1.0,
                    metadata={
                        "habit_id": str(habit.id),
                        "habit_name": habit.name,
                        "logged_on": logged_on.isoformat(),
                        "target_days_per_week": habit.target_days_per_week,
                    },
                    timestamp=datetime.combine(logged_on, time(hour=7), tzinfo=UTC),
                )

    projects = [
        Project(
            user_id=user.id,
            name="Life Observability Platform MVP",
            description="Ship a cohesive life observability platform.",
            status=ProjectStatus.active,
            progress_percentage=68,
            start_date=today - timedelta(days=21),
            target_date=today + timedelta(days=14),
        ),
        Project(
            user_id=user.id,
            name="Career capital system",
            description="Create a repeatable operating rhythm for learning and publishing.",
            status=ProjectStatus.at_risk,
            progress_percentage=42,
            start_date=today - timedelta(days=30),
            target_date=today + timedelta(days=21),
        ),
        Project(
            user_id=user.id,
            name="Wellbeing dashboard",
            description="Track energy, sleep, and movement without manual friction.",
            status=ProjectStatus.planning,
            progress_percentage=18,
            start_date=today - timedelta(days=10),
            target_date=today + timedelta(days=40),
        ),
    ]
    db.add_all(projects)
    db.flush()

    project_update_data = [
        (projects[0], "Completed dashboard shell and CRUD API contracts.", 52, 12),
        (projects[0], "Integrated frontend metrics page with analytics endpoints.", 68, 3),
        (projects[1], "Defined learning themes and backlog items.", 25, 20),
        (projects[1], "Progress slowed while the weekly schedule was overloaded.", 42, 6),
        (projects[2], "Captured success criteria and initial KPI list.", 18, 4),
    ]
    last_progress_by_project = {project.id: 0 for project in projects}
    for project, content, progress, days_ago in project_update_data:
        update = ProjectUpdate(
            project_id=project.id,
            content=content,
            progress_percentage=progress,
            created_at=project.created_at + timedelta(days=max(1, 21 - days_ago)),
            updated_at=project.created_at + timedelta(days=max(1, 21 - days_ago)),
        )
        db.add(update)
        db.flush()
        create_metric_event(
            db,
            user_id=user.id,
            event_type="project_progress_update",
            value=float(progress),
            metadata={
                "project_id": str(project.id),
                "project_name": project.name,
                "previous_progress_percentage": last_progress_by_project[project.id],
                "progress_percentage": progress,
                "progress_delta": progress - last_progress_by_project[project.id],
                "update_id": str(update.id),
            },
            timestamp=update.created_at,
        )
        last_progress_by_project[project.id] = progress

    db.commit()
