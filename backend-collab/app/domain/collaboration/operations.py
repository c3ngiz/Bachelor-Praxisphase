"""Plain-text operation primitives shared by the collaboration domain.

The collaboration engine works on Python Unicode string positions. A position is
therefore a Python code-point offset, matching the frontend's conversion from
CodeMirror UTF-16 offsets into code-point offsets before operations are sent.
Only two operation types are supported: ``insert`` and ``delete``.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, TypeAlias

TextOperation: TypeAlias = dict[str, Any]


@dataclass(frozen=True)
class OperationIdentity:
    """Stable identity used to deterministically order concurrent operations.

    Concurrent inserts at the same position are ordered lexicographically by
    ``(client_id, op_id)``. The operation with the smaller key stays to the left;
    the operation with the larger key shifts right by the accepted insert's text
    length. Server sequence still determines history order, while this key makes
    same-position inserts deterministic across retries and clients.
    """

    client_id: str
    op_id: str

    def tie_key(self) -> tuple[str, str]:
        """Return the deterministic key used for equal-position insert ties."""

        return (self.client_id, self.op_id)


def clone_op(op: TextOperation) -> TextOperation:
    """Return a shallow copy of an operation before mutating transform fields."""

    return dict(op)


def op_text_len(op: TextOperation) -> int:
    """Return the inserted text length measured in Python code points."""

    return len(str(op.get("text", "")))


def op_delete_len(op: TextOperation) -> int:
    """Return a non-negative delete length from a text operation payload."""

    return max(0, int(op.get("len", 0)))


def clamp_position(content: str, pos: int) -> int:
    """Clamp a code-point position into the current document bounds."""

    return max(0, min(pos, len(content)))


def clamp_index(pos: int, document_length: int) -> int:
    """Clamp a code-point position into an explicit document length."""

    return max(0, min(pos, max(0, document_length)))


def apply_operation(content: str, op: TextOperation) -> str:
    """Apply an already transformed operation to a Unicode Python string.

    Invalid positions are clamped instead of raising. Delete lengths below zero
    are treated as zero, and deletes extending past the end of the content are
    clipped to the current document length.
    """

    pos = clamp_position(content, int(op["pos"]))

    if op["type"] == "insert":
        text = str(op.get("text", ""))
        return content[:pos] + text + content[pos:]

    length = op_delete_len(op)
    end = clamp_position(content, pos + length)
    return content[:pos] + content[end:]
