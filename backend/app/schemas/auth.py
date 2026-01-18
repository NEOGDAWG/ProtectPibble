from __future__ import annotations

from pydantic import BaseModel, EmailStr, Field, field_validator, ConfigDict

from app.schemas.base import ApiModel


class RegisterRequest(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,  # Allow both field name and alias
        str_strip_whitespace=True,
    )
    
    email: EmailStr
    # Accept both displayName (camelCase) and display_name (snake_case)
    # The frontend sends displayName, which gets converted to display_name by decamelizeKeys
    # But we also accept displayName directly via alias for robustness
    display_name: str = Field(
        ...,
        min_length=1,
        max_length=120,
    )
    password: str = Field(..., min_length=8, max_length=100)
    
    # Allow displayName as an alternative field name (fallback if decamelizeKeys fails)
    @classmethod
    def model_validate(cls, obj, **kwargs):
        if isinstance(obj, dict):
            # If displayName is present but display_name is not, convert it
            if "displayName" in obj and "display_name" not in obj:
                obj = {**obj, "display_name": obj.pop("displayName")}
            # Also accept displayName as an alias
            elif "displayName" in obj and "display_name" in obj:
                # Both present, prefer display_name
                obj.pop("displayName", None)
        return super().model_validate(obj, **kwargs)

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
