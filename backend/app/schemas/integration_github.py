from datetime import datetime
from typing import Literal

from pydantic import Field

from app.schemas.common import ORMModel


class GitHubSyncRequest(ORMModel):
    username: str | None = None
    token: str | None = None
    days: int = Field(default=7, ge=1, le=90)
    repo_limit: int = Field(default=20, ge=1, le=100)
    per_repo_commit_limit: int = Field(default=20, ge=1, le=100)
    visibility: Literal["all", "public", "private"] = "all"


class GitHubSyncResponse(ORMModel):
    provider: Literal["github"] = "github"
    username: str
    synced_at: datetime
    days: int
    repositories_fetched: int
    commits_fetched: int
    repository_events_created: int
    commit_events_created: int
