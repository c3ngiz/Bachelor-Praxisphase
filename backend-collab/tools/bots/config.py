"""Configuration loading for the collaboration bot harness.

The runner is intentionally environment-driven so the same code can target a
local developer server, a containerized backend, or a thesis evaluation
environment without source edits. Defaults match the current backend settings:
REST on ``http://localhost:4000`` and WebSockets on ``ws://localhost:4000``.
"""

from __future__ import annotations

import os
from dataclasses import dataclass, replace

from tools.bots.models import BotAccount


@dataclass(frozen=True)
class BotConfig:
    """Runtime settings used by REST setup, WebSocket clients, and reporting."""

    api_base_url: str = "http://localhost:4000"
    ws_base_url: str = "ws://localhost:4000"
    owner_email: str = "bot-owner@example.com"
    owner_password: str = "BotPassword123!"
    owner_name: str = "Bot Owner"
    collaborator_email: str = "bot-collaborator@example.com"
    collaborator_password: str = "BotPassword123!"
    collaborator_name: str = "Bot Collaborator"
    timeout_seconds: float = 20.0
    verbose: bool = True

    @classmethod
    def from_env(cls) -> "BotConfig":
        """Build configuration from ``BOT_*`` environment variables."""

        return cls(
            api_base_url=_clean_url(os.getenv("BOT_API_BASE_URL"), cls.api_base_url),
            ws_base_url=_clean_url(os.getenv("BOT_WS_BASE_URL"), cls.ws_base_url),
            owner_email=os.getenv("BOT_OWNER_EMAIL", cls.owner_email),
            owner_password=os.getenv("BOT_OWNER_PASSWORD", cls.owner_password),
            owner_name=os.getenv("BOT_OWNER_NAME", cls.owner_name),
            collaborator_email=os.getenv("BOT_COLLAB_EMAIL", cls.collaborator_email),
            collaborator_password=os.getenv("BOT_COLLAB_PASSWORD", cls.collaborator_password),
            collaborator_name=os.getenv("BOT_COLLAB_NAME", cls.collaborator_name),
            timeout_seconds=_read_float("BOT_TIMEOUT_SECONDS", cls.timeout_seconds),
            verbose=_read_bool("BOT_VERBOSE", cls.verbose),
        )

    def with_overrides(
        self,
        *,
        api_base_url: str | None = None,
        ws_base_url: str | None = None,
        timeout_seconds: float | None = None,
        verbose: bool | None = None,
    ) -> "BotConfig":
        """Return a copy with command-line overrides applied."""

        return replace(
            self,
            api_base_url=_clean_url(api_base_url, self.api_base_url),
            ws_base_url=_clean_url(ws_base_url, self.ws_base_url),
            timeout_seconds=timeout_seconds if timeout_seconds is not None else self.timeout_seconds,
            verbose=verbose if verbose is not None else self.verbose,
        )

    @property
    def owner_account(self) -> BotAccount:
        """Return deterministic credentials for the owner bot."""

        return BotAccount(
            email=self.owner_email,
            password=self.owner_password,
            name=self.owner_name,
        )

    @property
    def collaborator_account(self) -> BotAccount:
        """Return deterministic credentials for the collaborator bot."""

        return BotAccount(
            email=self.collaborator_email,
            password=self.collaborator_password,
            name=self.collaborator_name,
        )


def _clean_url(value: str | None, default: str) -> str:
    """Normalize optional URL environment values without changing their path."""

    selected = (value or default).strip()
    return selected[:-1] if selected.endswith("/") else selected


def _read_bool(name: str, default: bool) -> bool:
    """Parse permissive boolean values from the environment."""

    value = os.getenv(name)

    if value is None:
        return default

    return value.strip().lower() in {"1", "true", "yes", "y", "on"}


def _read_float(name: str, default: float) -> float:
    """Parse a positive float from the environment with a safe fallback."""

    value = os.getenv(name)

    if value is None:
        return default

    try:
        parsed = float(value)
    except ValueError:
        return default

    return parsed if parsed > 0 else default

