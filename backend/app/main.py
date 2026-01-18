from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import get_settings
from app.db.base import Base
from app.db.session import engine
from app.db.sqlite_schema import ensure_sqlite_columns

settings = get_settings()

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=settings.cors_allow_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def _ensure_sqlite_schema() -> None:
    # If we fell back to SQLite, create tables automatically for MVP dev.
    if engine.url.get_backend_name() == "sqlite":
        Base.metadata.create_all(bind=engine)
        ensure_sqlite_columns(engine)
    else:
        # For PostgreSQL, try to run migrations automatically on startup
        # This helps when Shell access is not available (e.g., free tier)
        try:
            from alembic.config import Config
            from alembic import command
            
            alembic_cfg = Config("alembic.ini")
            command.upgrade(alembic_cfg, "head")
        except Exception:
            # If migrations fail, continue anyway - tables might already exist
            pass

app.include_router(api_router)

