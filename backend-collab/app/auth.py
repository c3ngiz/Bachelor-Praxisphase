from __future__ import annotations

from fastapi import WebSocket
import jwt

from .models import UserSession
from .repository import CollaborationRepository


class AuthenticationError(Exception):
    """Raised when a WebSocket token is absent, invalid, or stale."""


class AuthService:
    def __init__(self, jwt_secret: str, repository: CollaborationRepository) -> None:
        self.jwt_secret = jwt_secret
        self.repository = repository

    async def authenticate_websocket(self, websocket: WebSocket) -> UserSession:
        token = websocket.query_params.get("token")

        if not token:
            raise AuthenticationError("Authentication token is required.")

        try:
            payload = jwt.decode(token, self.jwt_secret, algorithms=["HS256"])
        except jwt.PyJWTError as error:
            raise AuthenticationError("Authentication token is invalid or expired.") from error

        subject = payload.get("sub")
        email = payload.get("email")

        if not isinstance(subject, str) or not isinstance(email, str):
            raise AuthenticationError("Authentication token payload is invalid.")

        user = await self.repository.get_user(subject)

        if not user:
            raise AuthenticationError("Authentication token subject no longer exists.")

        return user
