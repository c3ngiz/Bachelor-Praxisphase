"""User persistence and response mapping shared by auth and sharing flows."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.common.datetime import to_iso
from app.common.utils import get_avatar_color, get_initials, normalize_email
from app.core.errors import ConflictAppError, NotFoundAppError
from app.db.models.user import User
from app.domain.auth.schemas import AuthUserResponse


class UsersService:
    """Encapsulates user creation, lookup, and collaborator search behavior."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create_user(
        self,
        *,
        email: str,
        name: str,
        password_hash: str,
        avatar_color: str | None,
    ) -> User:
        """Create a user with a pre-hashed password and normalized email."""

        normalized_email = normalize_email(email)
        existing = await self.find_by_email(normalized_email)

        if existing:
            raise ConflictAppError(
                "A user with this email already exists.", code="EMAIL_ALREADY_EXISTS"
            )

        user = User(
            email=normalized_email,
            name=name.strip(),
            password_hash=password_hash,
            avatar_color=avatar_color or get_avatar_color(normalized_email),
        )
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        return user

    async def find_by_email(self, email: str) -> User | None:
        """Find a user by exact email address after normalization."""

        result = await self.db.execute(
            select(User).where(func.lower(User.email) == normalize_email(email))
        )
        return result.scalar_one_or_none()

    async def find_by_id(self, user_id: str | UUID) -> User | None:
        """Find a user by identifier."""

        result = await self.db.execute(select(User).where(User.id == UUID(str(user_id))))
        return result.scalar_one_or_none()

    async def get_by_id_or_throw(self, user_id: str | UUID) -> User:
        """Resolve a user by id or raise a domain not-found error."""

        user = await self.find_by_id(user_id)

        if not user:
            raise NotFoundAppError("User not found.", code="USER_NOT_FOUND")

        return user

    async def search_by_email(self, email: str) -> list[User]:
        """Search users by partial email for collaborator invite typeahead."""

        query = normalize_email(email)

        if len(query) < 2:
            return []

        result = await self.db.execute(
            select(User)
            .where(User.email.ilike(f"%{query}%"))
            .order_by(User.email.asc())
            .limit(10)
        )
        return list(result.scalars().all())

    def to_user_response(self, user: User) -> AuthUserResponse:
        """Serialize a user into the frontend auth/workspace summary shape."""

        return AuthUserResponse(
            id=str(user.id),
            email=user.email,
            name=user.name,
            initials=get_initials(user.name, user.email),
            avatar_color=user.avatar_color or get_avatar_color(user.email),
            created_at=to_iso(user.created_at) or "",
            updated_at=to_iso(user.updated_at) or "",
        )
