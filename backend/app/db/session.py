from __future__ import annotations

import sys

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import get_settings

settings = get_settings()

requested_url = settings.database_url


def _make_engine(url: str):
    if url.startswith("sqlite"):
        return create_engine(
            url,
            connect_args={"check_same_thread": False},
            pool_pre_ping=True,
        )
    # Postgres/other
    return create_engine(
        url,
        connect_args={"connect_timeout": 2},
        pool_pre_ping=True,
    )


engine = _make_engine(requested_url)

# If Postgres isn't running locally, fall back to SQLite so the MVP still works.
if not requested_url.startswith("sqlite"):
    try:
        with engine.connect():
            pass
    except Exception:  # noqa: BLE001
        print(
            "[protectpibble] DATABASE_URL unreachable; falling back to local SQLite "
            "(backend/protectpibble.sqlite3).",
            file=sys.stderr,
        )
        engine = _make_engine("sqlite:///./protectpibble.sqlite3")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

