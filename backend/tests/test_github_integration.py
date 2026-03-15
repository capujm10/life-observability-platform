from sqlalchemy import select

from app.integrations.github.client import GitHubClient
from app.models import MetricEvent


def login(client) -> str:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "demo@personalos.local", "password": "demo123"},
    )
    assert response.status_code == 200
    return response.json()["access_token"]


def test_sync_github_activity_creates_events_and_skips_duplicates(client, db_session, monkeypatch):
    token = login(client)
    headers = {"Authorization": f"Bearer {token}"}

    repositories = [
        {
            "id": 101,
            "name": "life-observability-platform",
            "full_name": "demo/life-observability-platform",
            "private": False,
            "html_url": "https://github.com/demo/life-observability-platform",
            "default_branch": "main",
            "pushed_at": "2026-03-14T10:00:00Z",
            "updated_at": "2026-03-14T10:00:00Z",
            "owner": {"login": "demo"},
        }
    ]
    commits = [
        {
            "sha": "abc123",
            "html_url": "https://github.com/demo/life-observability-platform/commit/abc123",
            "commit": {
                "message": "feat: add observability sync",
                "author": {"date": "2026-03-14T12:00:00Z"},
            },
        }
    ]

    monkeypatch.setattr(GitHubClient, "get_authenticated_user", lambda self: {"login": "demo-user"})
    monkeypatch.setattr(GitHubClient, "list_repositories", lambda self, *, visibility, limit: repositories)
    monkeypatch.setattr(
        GitHubClient,
        "list_user_commits",
        lambda self, *, owner, repo, author, since, limit: commits,
    )

    payload = {
        "token": "test-token",
        "days": 7,
        "repo_limit": 10,
        "per_repo_commit_limit": 10,
        "visibility": "all",
    }

    first_response = client.post(
        "/api/v1/integrations/github/sync",
        headers=headers,
        json=payload,
    )

    assert first_response.status_code == 200
    first_payload = first_response.json()
    assert first_payload["provider"] == "github"
    assert first_payload["username"] == "demo-user"
    assert first_payload["repositories_fetched"] == 1
    assert first_payload["commits_fetched"] == 1
    assert first_payload["repository_events_created"] == 1
    assert first_payload["commit_events_created"] == 1

    github_events = db_session.scalars(
        select(MetricEvent).where(MetricEvent.event_type.in_(["github_repository_synced", "github_commit"]))
    ).all()
    assert len(github_events) == 2
    assert any(event.event_type == "github_commit" for event in github_events)
    assert any(event.event_type == "github_repository_synced" for event in github_events)

    commit_events_response = client.get(
        "/api/v1/events",
        headers=headers,
        params={"event_type": "github_commit", "limit": 20},
    )
    assert commit_events_response.status_code == 200
    commit_events = commit_events_response.json()
    assert any(event["metadata"]["sha"] == "abc123" for event in commit_events)

    second_response = client.post(
        "/api/v1/integrations/github/sync",
        headers=headers,
        json=payload,
    )

    assert second_response.status_code == 200
    second_payload = second_response.json()
    assert second_payload["repositories_fetched"] == 1
    assert second_payload["commits_fetched"] == 1
    assert second_payload["repository_events_created"] == 0
    assert second_payload["commit_events_created"] == 0

    github_events_after_second_sync = db_session.scalars(
        select(MetricEvent).where(MetricEvent.event_type.in_(["github_repository_synced", "github_commit"]))
    ).all()
    assert len(github_events_after_second_sync) == 2
