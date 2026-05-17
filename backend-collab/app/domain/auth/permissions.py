"""Authentication helpers shared by protected REST and GraphQL endpoints."""

from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.security import SecurityService
from app.db.models.user import User
from app.domain.users.service import UsersService


async def user_from_token(db: AsyncSession, token: str) -> User:
    """Decode a bearer token and return the persisted user it references."""

    security = SecurityService(get_settings())
    payload = security.decode_access_token(token)
    return await UsersService(db).get_by_id_or_throw(payload["sub"])
