"""Small deterministic formatting helpers shared by response mappers."""

from __future__ import annotations

import re
from typing import Any

AVATAR_COLORS = (
    "bg-emerald-500",
    "bg-sky-500",
    "bg-violet-500",
    "bg-amber-500",
    "bg-rose-500",
    "bg-cyan-500",
)


def to_camel(value: str) -> str:
    """Convert a snake_case field name to the camelCase JSON contract."""

    head, *tail = value.split("_")
    return head + "".join(part[:1].upper() + part[1:] for part in tail)


def normalize_email(email: str) -> str:
    """Normalize email addresses before lookup or persistence."""

    return email.strip().lower()


def get_initials(name: str, email: str) -> str:
    """Build one or two display initials from a name, falling back to email."""

    source = name.strip() or email.strip()
    parts = [part for part in re.split(r"\s+", source) if part]

    if len(parts) >= 2:
        return f"{parts[0][0]}{parts[1][0]}".upper()

    return source[:2].upper()


def get_avatar_color(email: str) -> str:
    """Pick the same deterministic Tailwind avatar color as the old backend."""

    total = sum(ord(character) for character in email)
    return AVATAR_COLORS[total % len(AVATAR_COLORS)]


def strip_none(value: dict[str, Any]) -> dict[str, Any]:
    """Return a shallow copy without keys whose value is None."""

    return {key: item for key, item in value.items() if item is not None}
