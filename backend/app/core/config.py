from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=(".env", "../.env"), extra="ignore")

    app_name: str = "ProtectPibble API"
    env: str = "dev"

    backend_host: str = "127.0.0.1"
    backend_port: int = 8000

    database_url: str = "postgresql+psycopg://protectpibble:protectpibble@127.0.0.1:5432/protectpibble"
    redis_url: str = "redis://127.0.0.1:6379/0"

    # Auth (Clerk recommended)
    clerk_issuer: str = ""
    clerk_jwks_url: str = ""

    cors_origins: list[str] = ["http://127.0.0.1:5173"]


@lru_cache
def get_settings() -> Settings:
    return Settings()

