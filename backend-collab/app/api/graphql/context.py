"""GraphQL request context and authentication helper."""

from __future__ import annotations

from dataclasses import dataclass

from fastapi import Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from strawberry.fastapi import BaseContext

from app.core.config import get_settings
from app.core.security import SecurityService, extract_bearer_token
from app.db.models.user import User
from app.db.session import get_db
from app.domain.users.service import UsersService


@dataclass
class GraphQLContext(BaseContext):
    """Per-request GraphQL context exposing the DB session and current user."""

    request: Request
    db: AsyncSession

    async def current_user(self) -> User:
        """Resolve the authenticated user from the GraphQL Authorization header."""

        authorization = self.request.headers.get("authorization")
        token = extract_bearer_token(authorization)
        payload = SecurityService(get_settings()).decode_access_token(token)
        return await UsersService(self.db).get_by_id_or_throw(payload["sub"])


async def get_graphql_context(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> GraphQLContext:
    """Build a Strawberry context object for each GraphQL request."""

    return GraphQLContext(request=request, db=db)
