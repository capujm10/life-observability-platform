from typing import Any
from typing import Protocol

from app.schemas.weekly_summary import WeeklySummaryRead


class SummaryProvider(Protocol):
    def generate(self, summary: WeeklySummaryRead) -> str:
        """Turn structured weekly summary data into natural language."""


class SyncProvider(Protocol):
    slug: str

    def sync(self, user_id: str, **kwargs: Any) -> Any:
        """Synchronize external data into the platform."""
