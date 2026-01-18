from __future__ import annotations

from sqlalchemy import Engine, text


def _column_names(engine: Engine, table: str) -> set[str]:
    with engine.connect() as conn:
        rows = conn.execute(text(f"PRAGMA table_info({table})")).fetchall()
    return {str(r[1]) for r in rows}  # name at index 1


def ensure_sqlite_columns(engine: Engine) -> None:
    """
    SQLite doesn't auto-migrate when SQLAlchemy models change.
    Add any missing columns required for the MVP to keep dev DBs working.
    """
    if engine.dialect.name != "sqlite":
        return

    # task_status grade columns
    try:
        status_cols = _column_names(engine, "task_status")
    except Exception:
        return

    with engine.begin() as conn:
        if "grade_letter" not in status_cols:
            conn.execute(text("ALTER TABLE task_status ADD COLUMN grade_letter VARCHAR(3)"))
        if "grade_percent" not in status_cols:
            conn.execute(text("ALTER TABLE task_status ADD COLUMN grade_percent INTEGER"))
        if "health_delta" not in status_cols:
            conn.execute(
                text(
                    "ALTER TABLE task_status "
                    "ADD COLUMN health_delta INTEGER NOT NULL DEFAULT 0"
                )
            )
