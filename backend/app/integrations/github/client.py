from datetime import datetime
from typing import Any

import httpx


class GitHubIntegrationError(RuntimeError):
    """Raised when GitHub synchronization cannot proceed."""


class GitHubClient:
    def __init__(
        self,
        *,
        token: str,
        base_url: str,
        api_version: str,
        timeout: float = 20.0,
    ) -> None:
        self._client = httpx.Client(
            base_url=base_url,
            headers={
                "Accept": "application/vnd.github+json",
                "Authorization": f"Bearer {token}",
                "X-GitHub-Api-Version": api_version,
            },
            timeout=timeout,
        )

    def close(self) -> None:
        self._client.close()

    def get_authenticated_user(self) -> dict[str, Any]:
        return self._get("/user")

    def list_repositories(self, *, visibility: str, limit: int) -> list[dict[str, Any]]:
        repositories: list[dict[str, Any]] = []
        page = 1
        per_page = min(limit, 100)

        while len(repositories) < limit:
            items = self._get(
                "/user/repos",
                params={
                    "visibility": visibility,
                    "sort": "updated",
                    "direction": "desc",
                    "per_page": per_page,
                    "page": page,
                },
            )
            if not isinstance(items, list) or not items:
                break

            repositories.extend(items)
            if len(items) < per_page:
                break
            page += 1

        return repositories[:limit]

    def list_user_commits(
        self,
        *,
        owner: str,
        repo: str,
        author: str,
        since: datetime,
        limit: int,
    ) -> list[dict[str, Any]]:
        commits = self._get(
            f"/repos/{owner}/{repo}/commits",
            params={
                "author": author,
                "since": since.isoformat().replace("+00:00", "Z"),
                "per_page": min(limit, 100),
            },
        )
        if not isinstance(commits, list):
            return []
        return commits[:limit]

    def _get(self, path: str, params: dict[str, Any] | None = None) -> Any:
        try:
            response = self._client.get(path, params=params)
            response.raise_for_status()
        except httpx.HTTPStatusError as error:
            detail = error.response.text or str(error)
            raise GitHubIntegrationError(
                f"GitHub API request failed for {path}: {error.response.status_code} {detail}"
            ) from error
        except httpx.HTTPError as error:
            raise GitHubIntegrationError(f"GitHub API request failed for {path}: {error}") from error
        return response.json()
