"""Plain-text OT helpers used by the collaboration bot clients.

These functions mirror the backend's string application and stable hashing
rules. Bots apply only server-finalized operations from ``ack`` and
``broadcast_op`` messages, which keeps the local model aligned with the
server-owned version sequence instead of relying on optimistic guesses.
"""

from __future__ import annotations

from typing import Any, TypeAlias


TextOperation: TypeAlias = dict[str, Any]

FNV1A_32_OFFSET = 2166136261
FNV1A_32_PRIME = 16777619


def apply_insert(content: str, pos: int, text: str) -> str:
    """Insert text at a clamped Python code-point offset."""

    index = clamp_position(content, pos)
    return content[:index] + text + content[index:]


def apply_delete(content: str, pos: int, length: int) -> str:
    """Delete a clamped range from a Python Unicode string."""

    index = clamp_position(content, pos)
    delete_length = max(0, length)
    end = clamp_position(content, index + delete_length)
    return content[:index] + content[end:]


def apply_operation(content: str, op: TextOperation) -> str:
    """Apply an insert or delete operation using backend-compatible clamping."""

    operation_type = str(op.get("type"))

    if operation_type == "insert":
        return apply_insert(content, int(op.get("pos", 0)), str(op.get("text", "")))

    if operation_type == "delete":
        return apply_delete(content, int(op.get("pos", 0)), int(op.get("len", 0)))

    raise ValueError(f"Unsupported text operation type: {operation_type}")


def content_hash(content: str) -> str:
    """Return the stable FNV-1a text hash used by backend divergence checks."""

    encoded = content.encode("utf-8")
    value = FNV1A_32_OFFSET

    for byte in encoded:
        value ^= byte
        value = (value * FNV1A_32_PRIME) & 0xFFFFFFFF

    return f"fnv1a32:{len(encoded)}:{value:08x}"


def is_operation_in_bounds(content: str, op: TextOperation) -> bool:
    """Return whether a finalized server operation is valid for current content."""

    operation_type = str(op.get("type"))
    pos = int(op.get("pos", 0))

    if pos < 0 or pos > len(content):
        return False

    if operation_type == "insert":
        return isinstance(op.get("text", ""), str)

    if operation_type == "delete":
        length = int(op.get("len", 0))
        return length > 0 and pos + length <= len(content)

    return False


def clamp_position(content: str, pos: int) -> int:
    """Clamp a code-point position into the current document bounds."""

    return max(0, min(pos, len(content)))


def cursor_positions_valid(content: str, cursor: dict[str, Any]) -> bool:
    """Validate cursor and selection offsets against the current plain text."""

    values = [
        int(cursor.get("pos", 0)),
        int(cursor.get("selection_start", cursor.get("selectionStart", 0))),
        int(cursor.get("selection_end", cursor.get("selectionEnd", 0))),
    ]

    return all(0 <= value <= len(content) for value in values)

