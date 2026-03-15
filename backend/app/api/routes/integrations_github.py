from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db_session
from app.integrations.github import GitHubIntegrationError, GitHubSyncProvider
from app.models import User
from app.schemas.integration_github import GitHubSyncRequest, GitHubSyncResponse

router = APIRouter()


@router.post("/sync", response_model=GitHubSyncResponse, status_code=status.HTTP_200_OK)
def sync_github_activity(
    payload: GitHubSyncRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db_session),
) -> GitHubSyncResponse:
    provider = GitHubSyncProvider(db)
    try:
        return provider.sync(
            user.id,
            username=payload.username,
            token=payload.token,
            days=payload.days,
            repo_limit=payload.repo_limit,
            per_repo_commit_limit=payload.per_repo_commit_limit,
            visibility=payload.visibility,
        )
    except GitHubIntegrationError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error)) from error
