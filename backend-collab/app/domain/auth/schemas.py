"""Pydantic schemas for authentication requests and responses."""

from __future__ import annotations

from pydantic import EmailStr, Field

from app.common.schemas import CamelModel


class RegisterRequest(CamelModel):
    """Request body accepted by registration REST and GraphQL operations."""

    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)
    avatar_color: str | None = Field(default=None, max_length=64)


class LoginRequest(CamelModel):
    """Request body accepted by login REST and GraphQL operations."""

    email: EmailStr
    password: str = Field(min_length=8, max_length=72)


class AuthUserResponse(CamelModel):
    """Authenticated user payload consumed by the frontend auth store."""

    id: str
    email: str
    name: str
    initials: str
    avatar_color: str
    created_at: str
    updated_at: str


class AuthSessionResponse(CamelModel):
    """Bearer token session returned from successful registration or login."""

    token: str
    user: AuthUserResponse


class CurrentUserResponse(CamelModel):
    """Wrapper returned by `/api/auth/me` and `/api/users/me`."""

    user: AuthUserResponse
