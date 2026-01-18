from __future__ import annotations

import uuid
from dataclasses import dataclass
from typing import Optional

from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.utils.jwt import decode_access_token

# Make HTTPBearer optional so demo auth can still work
security = HTTPBearer(auto_error=False)


@dataclass(frozen=True)
class CurrentUser:
    id: uuid.UUID
    email: str
    display_name: str


def get_current_user(
    db: Session = Depends(get_db),  # noqa: B008 (FastAPI dependency injection)
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    # Fallback to demo auth for backward compatibility
    x_demo_email: Optional[str] = Header(default=None, alias="X-Demo-Email"),
    x_demo_name: Optional[str] = Header(default=None, alias="X-Demo-Name"),
) -> CurrentUser:
    """
    Get current user from JWT token or fallback to demo auth.
    
    Priority:
    1. JWT token (Authorization: Bearer <token>)
    2. Demo headers (X-Demo-Email, X-Demo-Name) for backward compatibility
    """
    # Try JWT token first
    if credentials:
        token = credentials.credentials
        payload = decode_access_token(token)
        if payload:
            user_id = payload.get("sub")
            if user_id:
                try:
                    user_uuid = uuid.UUID(user_id)
                    user = db.scalar(select(User).where(User.id == user_uuid))
                    if user:
                        return CurrentUser(id=user.id, email=user.email, display_name=user.display_name)
                except ValueError:
                    pass

    # Fallback to demo auth for backward compatibility
    if x_demo_email:
        email = x_demo_email.strip().lower()
        if "@" not in email:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid X-Demo-Email")

        name = (x_demo_name or email.split("@")[0]).strip()
        if not name:
            name = email.split("@")[0]

        user = db.scalar(select(User).where(User.email == email))
        if user is None:
            # For demo auth, create user without password (legacy behavior)
            user = User(email=email, display_name=name, password_hash=None)
            db.add(user)
            db.commit()
            db.refresh(user)
        elif user.display_name != name and x_demo_name:
            user.display_name = name
            db.commit()
            db.refresh(user)

        return CurrentUser(id=user.id, email=user.email, display_name=user.display_name)

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated. Provide Authorization header or X-Demo-Email header.",
        headers={"WWW-Authenticate": "Bearer"},
    )

