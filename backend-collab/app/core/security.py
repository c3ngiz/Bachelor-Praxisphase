"""Password hashing, JWT creation, and bearer-token decoding utilities."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

import bcrypt
import jwt

from app.core.config import Settings
from app.core.errors import AppError, UnauthorizedError


class SecurityService:
    """Encapsulates password and JWT behavior used by REST, GraphQL, and WebSockets."""

    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    def hash_password(self, password: str) -> str:
        """Hash a plain-text password before persistence."""

        self.assert_bcrypt_length(password)
        return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt(rounds=12)).decode("utf-8")

    def verify_password(self, password: str, password_hash: str) -> bool:
        """Verify a plain-text password against a stored hash."""

        self.assert_bcrypt_length(password)
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))

    def create_access_token(self, *, user_id: str, email: str) -> str:
        """Create an HS256 JWT containing the old backend's `sub` and `email` claims."""

        expires_at = datetime.now(UTC) + self.settings.jwt_expiry
        payload = {"sub": user_id, "email": email, "exp": expires_at}
        return jwt.encode(payload, self.settings.jwt_secret, algorithm="HS256")

    def decode_access_token(self, token: str) -> dict[str, Any]:
        """Decode and validate a bearer token, raising a domain auth error on failure."""

        try:
            payload = jwt.decode(token, self.settings.jwt_secret, algorithms=["HS256"])
        except jwt.PyJWTError as error:
            raise UnauthorizedError("Authentication token is invalid or expired.") from error

        subject = payload.get("sub")
        email = payload.get("email")

        if not isinstance(subject, str) or not isinstance(email, str):
            raise UnauthorizedError("Authentication token payload is invalid.")

        return payload

    def assert_bcrypt_length(self, password: str) -> None:
        """Reject passwords bcrypt 5 would refuse because they exceed 72 bytes."""

        if len(password.encode("utf-8")) > 72:
            raise AppError(
                "Password must be 72 bytes or fewer.",
                code="PASSWORD_TOO_LONG",
                field_errors={"password": ["Password must be 72 bytes or fewer."]},
            )


def extract_bearer_token(authorization: str | None) -> str:
    """Extract a bearer token from an Authorization header value."""

    if not authorization:
        raise UnauthorizedError()

    scheme, _, token = authorization.partition(" ")

    if scheme.lower() != "bearer" or not token:
        raise UnauthorizedError("Authorization header must use the Bearer scheme.")

    return token
