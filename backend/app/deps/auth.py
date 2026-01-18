from __future__ import annotations

import uuid
from dataclasses import dataclass
from typing import Optional

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User


@dataclass(frozen=True)
class CurrentUser:
    id: uuid.UUID
    email: str
    display_name: str


def _require_demo_identity(
    x_demo_email: Optional[str],
    x_demo_name: Optional[str],
) -> tuple[str, str]:
    if not x_demo_email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=(
                "Missing identity. For MVP demo auth, send headers: "
                "X-Demo-Email and optionally X-Demo-Name."
            ),
        )

    email = x_demo_email.strip().lower()
    if "@" not in email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid X-Demo-Email")

    name = (x_demo_name or email.split("@")[0]).strip()
    if not name:
        name = email.split("@")[0]

    return email, name


def get_current_user(
    db: Session = Depends(get_db),  # noqa: B008 (FastAPI dependency injection)
    x_demo_email: Optional[str] = Header(default=None, alias="X-Demo-Email"),
    x_demo_name: Optional[str] = Header(default=None, alias="X-Demo-Name"),
) -> CurrentUser:
    """
    MVP auth: demo headers.

    Later: swap/extend with Clerk JWT validation (Authorization: Bearer <JWT>).
    """
    email, name = _require_demo_identity(x_demo_email, x_demo_name)

    user = db.scalar(select(User).where(User.email == email))
    if user is None:
        user = User(email=email, display_name=name)
        db.add(user)
        db.commit()
        db.refresh(user)
    elif user.display_name != name and x_demo_name:
        user.display_name = name
        db.commit()
        db.refresh(user)

    return CurrentUser(id=user.id, email=user.email, display_name=user.display_name)

