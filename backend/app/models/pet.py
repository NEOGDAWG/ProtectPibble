from __future__ import annotations

import uuid
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Pet(Base):
    __tablename__ = "pets"

    group_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("groups.id", ondelete="CASCADE"),
        primary_key=True,
    )

    name: Mapped[str] = mapped_column(String(80), nullable=False, default="Pibble")
    health: Mapped[int] = mapped_column(Integer, nullable=False, default=100)
    max_health: Mapped[int] = mapped_column(Integer, nullable=False, default=100)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

