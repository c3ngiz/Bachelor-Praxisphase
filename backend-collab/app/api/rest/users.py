"""REST user routes for current-user and collaborator lookup flows."""

from __future__ import annotations

from fastapi import APIRouter, Query

from app.common.dependencies import CurrentUser, DbSession
from app.domain.auth.schemas import CurrentUserResponse
from app.domain.users.schemas import UsersSearchResponse
from app.domain.users.service import UsersService

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=CurrentUserResponse)
async def me(current_user: CurrentUser, db: DbSession) -> CurrentUserResponse:
    """Return the current authenticated user."""

    return CurrentUserResponse(user=UsersService(db).to_user_response(current_user))


@router.get("/search", response_model=UsersSearchResponse)
async def search_users(
    _current_user: CurrentUser,
    db: DbSession,
    email: str = Query(default=""),
) -> UsersSearchResponse:
    """Search users by partial email for sharing dialogs."""

    service = UsersService(db)
    users = await service.search_by_email(email)
    return UsersSearchResponse(users=[service.to_user_response(user) for user in users])
