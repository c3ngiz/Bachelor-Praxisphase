"""Asynchronous REST client for bot authentication and workspace setup.

The client uses the same frontend REST contract documented by the backend:
bearer-token auth under ``/api/auth``, workspace explorer routes under
``/api/workspace``, document content loading, sharing, and collaboration
diagnostic endpoints. GraphQL is intentionally not used because REST fully
covers the required bot setup flow.
"""

from __future__ import annotations

from typing import Any

import httpx

from tools.bots.config import BotConfig
from tools.bots.models import AuthenticatedBot, BotAccount, JsonObject


class BotApiError(RuntimeError):
    """HTTP error raised with the backend's stable error code and message."""

    def __init__(self, status_code: int, code: str, message: str, payload: JsonObject) -> None:
        super().__init__(f"{status_code} {code}: {message}")
        self.status_code = status_code
        self.code = code
        self.message = message
        self.payload = payload


class RestClient:
    """Small HTTP client wrapping the REST calls needed by the bot scenario."""

    def __init__(self, config: BotConfig) -> None:
        self.config = config
        self.api_base_url = _api_base_url(config.api_base_url)
        self._client = httpx.AsyncClient(
            base_url=self.api_base_url,
            timeout=httpx.Timeout(config.timeout_seconds),
        )

    async def __aenter__(self) -> "RestClient":
        """Return this client for async context-manager use."""

        return self

    async def __aexit__(self, *_exc: object) -> None:
        """Close the underlying HTTP connection pool."""

        await self.close()

    async def close(self) -> None:
        """Release HTTP resources."""

        await self._client.aclose()

    async def sign_up_or_sign_in(self, account: BotAccount) -> AuthenticatedBot:
        """Register a bot account, falling back to login when it already exists."""

        created = True

        try:
            payload = await self._request(
                "POST",
                "/auth/register",
                json={
                    "name": account.name,
                    "email": account.email,
                    "password": account.password,
                },
            )
        except BotApiError as error:
            if error.status_code != 409:
                raise

            created = False
            payload = await self._request(
                "POST",
                "/auth/login",
                json={"email": account.email, "password": account.password},
            )

        user = payload["user"]
        return AuthenticatedBot(
            account=account,
            token=str(payload["token"]),
            user_id=str(user["id"]),
            email=str(user["email"]),
            name=str(user["name"]),
            created=created,
        )

    async def me(self, token: str) -> JsonObject:
        """Load the current authenticated user using ``/auth/me``."""

        return await self._request("GET", "/auth/me", token=token)

    async def create_folder(self, token: str, name: str) -> JsonObject:
        """Create a folder in the owner bot's workspace root."""

        return await self._request("POST", "/workspace/folders", token=token, json={"name": name})

    async def create_document(self, token: str, name: str, parent_id: str) -> JsonObject:
        """Create a document inside a writable folder."""

        return await self._request(
            "POST",
            "/workspace/documents",
            token=token,
            json={"name": name, "parentId": parent_id},
        )

    async def list_items(self, token: str, parent_id: str | None = None) -> JsonObject:
        """List root items or direct children of a folder."""

        params = {"parentId": parent_id} if parent_id else None
        return await self._request("GET", "/workspace/items", token=token, params=params)

    async def get_item(self, token: str, item_id: str) -> JsonObject:
        """Load one accessible workspace item."""

        return await self._request("GET", f"/workspace/items/{item_id}", token=token)

    async def get_document_content(self, token: str, document_id: str) -> JsonObject:
        """Load document content and write-permission state without touching recents."""

        return await self._request(
            "GET",
            f"/workspace/documents/{document_id}/content",
            token=token,
            params={"touch": "false"},
        )

    async def share_item(self, token: str, item_id: str, email: str, permission: str) -> JsonObject:
        """Share a document or folder with an existing user by email."""

        return await self._request(
            "POST",
            f"/workspace/items/{item_id}/share",
            token=token,
            json={"email": email, "permission": permission},
        )

    async def list_collaborators(self, token: str, item_id: str) -> JsonObject:
        """Return the direct collaborator list for an accessible item."""

        return await self._request(
            "GET",
            f"/workspace/items/{item_id}/collaborators",
            token=token,
        )

    async def get_collaboration_snapshot(self, token: str, document_id: str) -> JsonObject:
        """Load the server-owned collaboration snapshot for divergence checks."""

        return await self._request(
            "GET",
            f"/collaboration/documents/{document_id}/snapshot",
            token=token,
        )

    async def check_hash(self, token: str, document_id: str, version: int, hash_value: str) -> JsonObject:
        """Compare a bot's local content hash with the server snapshot."""

        return await self._request(
            "POST",
            f"/collaboration/documents/{document_id}/hash-check",
            token=token,
            json={"version": version, "hash": hash_value},
        )

    async def get_metrics(self, token: str, document_id: str) -> JsonObject:
        """Load persisted server-side collaboration metrics for one document."""

        return await self._request(
            "GET",
            f"/collaboration/documents/{document_id}/metrics",
            token=token,
        )

    async def _request(
        self,
        method: str,
        path: str,
        *,
        token: str | None = None,
        json: JsonObject | None = None,
        params: dict[str, Any] | None = None,
    ) -> JsonObject:
        """Send one HTTP request and normalize backend error responses."""

        headers = {"Authorization": f"Bearer {token}"} if token else None
        response = await self._client.request(
            method,
            path,
            headers=headers,
            json=json,
            params=params,
        )

        if response.status_code >= 400:
            raise _api_error(response)

        if not response.content:
            return {}

        payload = response.json()
        return payload if isinstance(payload, dict) else {"data": payload}


def _api_base_url(value: str) -> str:
    """Return a base URL rooted at the backend REST ``/api`` prefix."""

    cleaned = value.rstrip("/")
    return cleaned if cleaned.endswith("/api") else f"{cleaned}/api"


def _api_error(response: httpx.Response) -> BotApiError:
    """Map an HTTP error response into a bot-specific exception."""

    try:
        payload = response.json()
    except ValueError:
        payload = {"code": "HTTP_ERROR", "message": response.text}

    if not isinstance(payload, dict):
        payload = {"code": "HTTP_ERROR", "message": str(payload)}

    return BotApiError(
        status_code=response.status_code,
        code=str(payload.get("code", "HTTP_ERROR")),
        message=str(payload.get("message", response.reason_phrase)),
        payload=payload,
    )

