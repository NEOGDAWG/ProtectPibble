from __future__ import annotations

from pydantic import BaseModel, EmailStr, Field, field_validator, ConfigDict

from app.schemas.base import ApiModel


class RegisterRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)  # Allow both snake_case and camelCase
    
    email: EmailStr
    display_name: str = Field(..., min_length=1, max_length=120, alias="displayName")
    password: str = Field(..., min_length=8, max_length=100)

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.islower() for c in v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one number")
        return v

    @field_validator("display_name")
    @classmethod
    def validate_display_name(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Display name cannot be empty")
        if len(v) > 120:
            raise ValueError("Display name must be 120 characters or less")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(ApiModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"


class UserResponse(ApiModel):
    id: str
    email: str
    display_name: str
