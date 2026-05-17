"""Pydantic user response schemas."""

from __future__ import annotations

from app.common.schemas import CamelModel
from app.domain.auth.schemas import AuthUserResponse


class UsersSearchResponse(CamelModel):
    """Response body for collaborator email search."""

    users: list[AuthUserResponse]
