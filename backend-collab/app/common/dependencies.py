"""FastAPI dependency helpers for authenticated REST requests."""

from __future__ import annotations

from typing import Annotated

from fastapi import Depends, Header
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.security import SecurityService, extract_bearer_token
from app.db.models.user import User
from app.db.session import get_db
from app.domain.users.service import UsersService

DbSession = Annotated[AsyncSession, Depends(get_db)]


async def get_current_user(
    db: DbSession,
    authorization: Annotated[str | None, Header()] = None,
) -> User:
    """Resolve the authenticated user from a REST bearer token."""

    security = SecurityService(get_settings())
    token = extract_bearer_token(authorization)
    payload = security.decode_access_token(token)
    return await UsersService(db).get_by_id_or_throw(payload["sub"])


CurrentUser = Annotated[User, Depends(get_current_user)]
