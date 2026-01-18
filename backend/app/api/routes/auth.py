from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import AuthResponse, LoginRequest, RegisterRequest, UserResponse
from app.utils.jwt import create_access_token
from app.utils.password import hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(
    body: RegisterRequest,
    db: Session = Depends(get_db),
) -> AuthResponse:
    """Register a new user with email and password. Authentication required for all other endpoints."""
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"Register request received: email={body.email}, display_name={body.display_name}")
    
    # Normalize email
    email = body.email.lower().strip()
    
    # Check if user already exists
    existing = db.scalar(select(User).where(User.email == email))
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered. Please login instead.",
        )

    # Create new user
    password_hash = hash_password(body.password)
    user = User(
        email=email,
        display_name=body.display_name.strip(),
        password_hash=password_hash,
    )

    try:
        db.add(user)
        db.commit()
        db.refresh(user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Create access token
    access_token = create_access_token(data={"sub": str(user.id), "email": user.email})

    return AuthResponse(
        access_token=access_token,
        user=UserResponse(id=str(user.id), email=user.email, display_name=user.display_name),
    )


@router.post("/login", response_model=AuthResponse)
def login(
    body: LoginRequest,
    db: Session = Depends(get_db),
) -> AuthResponse:
    """Login with email and password."""
    # Find user
    user = db.scalar(select(User).where(User.email == body.email.lower().strip()))
    if user is None:
        # User requested specific error message for account not found
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No account found with this email. Please register first.",
        )

    # Verify password
    if not user.password_hash:
        # User exists but has no password (legacy demo user)
        # Require them to set a password
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="This account needs to be set up. Please register with a password.",
        )
    
    if not verify_password(body.password, user.password_hash):
        # Email exists but password is wrong
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password. Please try again.",
        )

    # Create access token
    access_token = create_access_token(data={"sub": str(user.id), "email": user.email})

    return AuthResponse(
        access_token=access_token,
        user=UserResponse(id=str(user.id), email=user.email, display_name=user.display_name),
    )
