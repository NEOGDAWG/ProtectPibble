from __future__ import annotations

import uuid
from typing import Optional

from sqlalchemy import DateTime, String, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Class(Base):
    __tablename__ = "classes"
    __table_args__ = (
        UniqueConstraint("school", "code", "term", name="uq_classes_school_code_term"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    school: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    code: Mapped[str] = mapped_column(String(50), nullable=False)
    term: Mapped[str] = mapped_column(String(50), nullable=False)

    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

