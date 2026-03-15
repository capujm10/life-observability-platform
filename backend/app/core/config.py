from functools import lru_cache

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_name: str = "Life Observability Platform API"
    environment: str = "development"
    debug: bool = True
    api_v1_prefix: str = "/api/v1"
    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/personal_os"
    secret_key: str = "change-me-in-production"
    cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:3000"])
    access_token_ttl_hours: int = 24
    jwt_algorithm: str = "HS256"
    jwt_issuer: str = "life-observability-platform"
    auto_seed_demo_data: bool = True
    demo_user_email: str = "demo@personalos.local"
    demo_user_password: str = "demo123"
    github_api_base_url: str = "https://api.github.com"
    github_api_version: str = "2022-11-28"
    github_api_token: str | None = None
    github_username: str | None = None
    github_sync_default_days: int = 7

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, value: str | list[str]) -> list[str]:
        if isinstance(value, list):
            return value
        if not value:
            return []
        return [origin.strip() for origin in value.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
