from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
import traceback

from app.api.router import api_router
from app.core.config import get_settings
from app.db.base import Base
from app.db.session import engine
from app.db.sqlite_schema import ensure_sqlite_columns

settings = get_settings()

# Log CORS configuration for debugging
import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
logger.info(f"CORS origins configured: {settings.cors_origins}")
logger.info(f"CORS origin regex: {settings.cors_allow_origin_regex}")

app = FastAPI(
    title=settings.app_name,
    description="ProtectPibble - Collaborative class pet accountability app",
    version="1.0.0",
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler to log and return detailed errors."""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": str(exc),
            "type": type(exc).__name__,
            "traceback": traceback.format_exc() if settings.env == "dev" else None,
        },
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=settings.cors_allow_origin_regex,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
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

