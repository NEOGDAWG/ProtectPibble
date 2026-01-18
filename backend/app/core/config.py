from __future__ import annotations

from functools import lru_cache
from typing import Optional

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=(".env", "../.env"), extra="ignore")

    app_name: str = "ProtectPibble API"
    env: str = "dev"

    backend_host: str = "127.0.0.1"
    backend_port: int = 8000

    database_url: str = "postgresql+psycopg://protectpibble:protectpibble@127.0.0.1:5432/protectpibble"
    redis_url: str = "redis://127.0.0.1:6379/0"

    # Auth (JWT)
    jwt_secret_key: str = ""  # Set via JWT_SECRET_KEY env var in production
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24 * 7  # 7 days

    # Auth (Clerk recommended - optional)
    clerk_issuer: str = ""
    clerk_jwks_url: str = ""

    # Frontend dev server ports may change (Vite uses next free port).
    # Production origins should be set via CORS_ORIGINS env var (comma-separated)
    # e.g., CORS_ORIGINS=https://yourapp.vercel.app,https://www.yourapp.com
    cors_origins: str | list[str] = [
        "http://127.0.0.1:5173",
        "http://localhost:5173",
    ]
    cors_allow_origin_regex: Optional[str] = r"^http://(localhost|127\.0\.0\.1):\d+$"

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: str | list[str]) -> list[str]:
        if isinstance(v, str):
            # Parse comma-separated string
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v


@lru_cache
def get_settings() -> Settings:
    return Settings()

