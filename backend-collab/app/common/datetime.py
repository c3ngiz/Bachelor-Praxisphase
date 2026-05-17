"""Date and time helpers for API serialization and database timestamps."""

from __future__ import annotations

from datetime import UTC, datetime


def utc_now() -> datetime:
    """Return an aware UTC timestamp for persistence and API responses."""

    return datetime.now(UTC)


def to_iso(value: datetime | None) -> str | None:
    """Serialize a timestamp to the ISO string shape expected by the frontend."""

    if value is None:
        return None

    if value.tzinfo is None:
        value = value.replace(tzinfo=UTC)

    return value.isoformat().replace("+00:00", "Z")
