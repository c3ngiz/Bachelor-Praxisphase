"""Authentication service for registration, login, and current-session lookup."""

from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import UnauthorizedError
from app.core.security import SecurityService
from app.domain.auth.schemas import AuthSessionResponse, CurrentUserResponse, LoginRequest, RegisterRequest
from app.domain.users.service import UsersService


class AuthService:
    """Coordinates password hashing, credential verification, and JWT issuance."""

    def __init__(self, db: AsyncSession, security: SecurityService) -> None:
        self.db = db
        self.security = security
        self.users = UsersService(db)

    async def register(self, input: RegisterRequest) -> AuthSessionResponse:
        """Register a new user and return an authenticated bearer session."""

        user = await self.users.create_user(
            avatar_color=input.avatar_color,
            email=str(input.email),
            name=input.name,
            password_hash=self.security.hash_password(input.password),
        )
        return self.create_session(user)

    async def login(self, input: LoginRequest) -> AuthSessionResponse:
        """Authenticate a user by email/password and return a bearer session."""

        user = await self.users.find_by_email(str(input.email))
        is_valid = user and self.security.verify_password(input.password, user.password_hash)

        if not user or not is_valid:
            raise UnauthorizedError("Invalid email or password.")

        return self.create_session(user)

    async def current_user(self, user_id: str) -> CurrentUserResponse:
        """Return the current user payload for an authenticated token subject."""

        user = await self.users.get_by_id_or_throw(user_id)
        return CurrentUserResponse(user=self.users.to_user_response(user))

    def create_session(self, user) -> AuthSessionResponse:
        """Create a frontend-compatible auth session for a persisted user."""

        return AuthSessionResponse(
            token=self.security.create_access_token(user_id=str(user.id), email=user.email),
            user=self.users.to_user_response(user),
        )
