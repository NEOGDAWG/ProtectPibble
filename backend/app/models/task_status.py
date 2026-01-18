from __future__ import annotations

import uuid
from typing import Optional

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.enums import TaskStatusValue


class TaskStatus(Base):
    __tablename__ = "task_status"

    task_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tasks.id", ondelete="CASCADE"),
        primary_key=True,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )

    status: Mapped[TaskStatusValue] = mapped_column(
        Enum(TaskStatusValue, name="taskstatusvalue"),
        nullable=False,
    )
    completed_at: Mapped[Optional[DateTime]] = mapped_column(DateTime(timezone=True), nullable=True)
    grade_letter: Mapped[Optional[str]] = mapped_column(String(3), nullable=True)
    grade_percent: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    health_delta: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

