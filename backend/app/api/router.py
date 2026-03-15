from fastapi import APIRouter

from app.api.routes import auth, dashboard, events, habits, health, integrations_github, journal, metrics, projects, settings, tasks, weekly_insights, weekly_summary

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(tasks.router, prefix="/tasks", tags=["tasks"])
api_router.include_router(habits.router, prefix="/habits", tags=["habits"])
api_router.include_router(journal.router, prefix="/journal-entries", tags=["journal"])
api_router.include_router(projects.router, prefix="/projects", tags=["projects"])
api_router.include_router(integrations_github.router, prefix="/integrations/github", tags=["integrations"])
api_router.include_router(events.router, prefix="/events", tags=["events"])
api_router.include_router(metrics.router, prefix="/metrics", tags=["metrics"])
api_router.include_router(weekly_insights.router, prefix="/weekly-insights", tags=["weekly-insights"])
api_router.include_router(weekly_summary.router, prefix="/weekly-summary", tags=["weekly-summary"])
api_router.include_router(settings.router, prefix="/settings", tags=["settings"])
