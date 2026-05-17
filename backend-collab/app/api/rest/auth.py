"""REST authentication routes matching the frontend auth client."""

from __future__ import annotations

from fastapi import APIRouter, Response, status

from app.common.dependencies import CurrentUser, DbSession
from app.core.config import get_settings
from app.core.security import SecurityService
from app.domain.auth.schemas import AuthSessionResponse, CurrentUserResponse, LoginRequest, RegisterRequest
from app.domain.auth.service import AuthService
from app.domain.users.service import UsersService

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=AuthSessionResponse)
async def register(input: RegisterRequest, db: DbSession) -> AuthSessionResponse:
    """Register a new user through the canonical frontend REST endpoint."""

    return await AuthService(db, SecurityService(get_settings())).register(input)


@router.post("/sign-up", response_model=AuthSessionResponse)
async def sign_up(input: RegisterRequest, db: DbSession) -> AuthSessionResponse:
    """Backward-compatible registration alias."""

    return await register(input, db)


@router.post("/signup", response_model=AuthSessionResponse)
async def signup(input: RegisterRequest, db: DbSession) -> AuthSessionResponse:
    """Backward-compatible registration alias without a hyphen."""

    return await register(input, db)


@router.post("/login", response_model=AuthSessionResponse)
async def login(input: LoginRequest, db: DbSession) -> AuthSessionResponse:
    """Authenticate an existing user through the canonical frontend REST endpoint."""

    return await AuthService(db, SecurityService(get_settings())).login(input)


@router.post("/sign-in", response_model=AuthSessionResponse)
async def sign_in(input: LoginRequest, db: DbSession) -> AuthSessionResponse:
    """Backward-compatible sign-in alias."""

    return await login(input, db)


@router.get("/me", response_model=CurrentUserResponse)
async def me(current_user: CurrentUser, db: DbSession) -> CurrentUserResponse:
    """Return the current authenticated user for a stored bearer token."""

    return CurrentUserResponse(user=UsersService(db).to_user_response(current_user))


@router.post("/sign-out", status_code=status.HTTP_204_NO_CONTENT)
async def sign_out(_current_user: CurrentUser) -> Response:
    """No-op sign-out endpoint for bearer-token clients."""

    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(_current_user: CurrentUser) -> Response:
    """Logout alias for clients using older route names."""

    return Response(status_code=status.HTTP_204_NO_CONTENT)
