from datetime import UTC, date, datetime, time, timedelta
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.integrations.github.client import GitHubClient, GitHubIntegrationError
from app.models import MetricEvent
from app.schemas.integration_github import GitHubSyncResponse
from app.services.events import create_metric_event


class GitHubSyncProvider:
    slug = "github"

    def __init__(self, db: Session) -> None:
        self.db = db
        self.settings = get_settings()

    def sync(
        self,
        user_id: UUID,
        *,
        username: str | None = None,
        token: str | None = None,
        days: int | None = None,
        repo_limit: int = 20,
        per_repo_commit_limit: int = 20,
        visibility: str = "all",
    ) -> GitHubSyncResponse:
        access_token = token or self.settings.github_api_token
        if not access_token:
            raise GitHubIntegrationError("GitHub API token is required for synchronization.")

        sync_days = days or self.settings.github_sync_default_days
        since = datetime.combine(date.today() - timedelta(days=sync_days - 1), time.min, tzinfo=UTC)
        client = GitHubClient(
            token=access_token,
            base_url=self.settings.github_api_base_url,
            api_version=self.settings.github_api_version,
        )

        try:
            resolved_username = username or self.settings.github_username
            if not resolved_username:
                authenticated_user = client.get_authenticated_user()
                resolved_username = authenticated_user.get("login")
            if not resolved_username:
                raise GitHubIntegrationError("Unable to determine the GitHub username to sync.")

            repositories = client.list_repositories(visibility=visibility, limit=repo_limit)
            existing_source_ids = self._existing_source_ids(user_id)

            repository_events_created = 0
            commit_events_created = 0
            commits_fetched = 0

            for repository in repositories:
                repo_source_id = self._repository_source_id(repository)
                if repo_source_id not in existing_source_ids:
                    create_metric_event(
                        self.db,
                        user_id=user_id,
                        event_type="github_repository_synced",
                        value=1.0,
                        metadata={
                            "provider": self.slug,
                            "source_id": repo_source_id,
                            "repository_id": repository["id"],
                            "repository_name": repository["name"],
                            "full_name": repository["full_name"],
                            "private": repository.get("private", False),
                            "html_url": repository.get("html_url"),
                            "default_branch": repository.get("default_branch"),
                            "pushed_at": repository.get("pushed_at"),
                        },
                    )
                    existing_source_ids.add(repo_source_id)
                    repository_events_created += 1

                owner = repository.get("owner", {}).get("login")
                repo_name = repository.get("name")
                if not owner or not repo_name:
                    continue

                commits = client.list_user_commits(
                    owner=owner,
                    repo=repo_name,
                    author=resolved_username,
                    since=since,
                    limit=per_repo_commit_limit,
                )
                commits_fetched += len(commits)

                for commit in commits:
                    sha = commit.get("sha")
                    if not sha:
                        continue
                    commit_source_id = f"github_commit:{sha}"
                    if commit_source_id in existing_source_ids:
                        continue

                    committed_at = commit.get("commit", {}).get("author", {}).get("date")
                    timestamp = self._parse_timestamp(committed_at)
                    create_metric_event(
                        self.db,
                        user_id=user_id,
                        event_type="github_commit",
                        value=1.0,
                        metadata={
                            "provider": self.slug,
                            "source_id": commit_source_id,
                            "sha": sha,
                            "repository_id": repository["id"],
                            "repository_name": repository["name"],
                            "full_name": repository["full_name"],
                            "author_login": resolved_username,
                            "message": commit.get("commit", {}).get("message"),
                            "html_url": commit.get("html_url"),
                            "committed_at": committed_at,
                        },
                        timestamp=timestamp,
                    )
                    existing_source_ids.add(commit_source_id)
                    commit_events_created += 1

            self.db.commit()

            return GitHubSyncResponse(
                username=resolved_username,
                synced_at=datetime.now(UTC),
                days=sync_days,
                repositories_fetched=len(repositories),
                commits_fetched=commits_fetched,
                repository_events_created=repository_events_created,
                commit_events_created=commit_events_created,
            )
        except Exception:
            self.db.rollback()
            raise
        finally:
            client.close()

    def _existing_source_ids(self, user_id: UUID) -> set[str]:
        events = self.db.scalars(
            select(MetricEvent).where(
                MetricEvent.user_id == user_id,
                MetricEvent.event_type.in_(["github_commit", "github_repository_synced"]),
            )
        ).all()
        return {
            str(source_id)
            for event in events
            for source_id in [event.event_metadata.get("source_id")]
            if source_id
        }

    def _repository_source_id(self, repository: dict) -> str:
        pushed_at = repository.get("pushed_at") or repository.get("updated_at") or "unknown"
        return f"github_repo:{repository['id']}:{pushed_at}"

    def _parse_timestamp(self, value: str | None) -> datetime | None:
        if not value:
            return None
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
