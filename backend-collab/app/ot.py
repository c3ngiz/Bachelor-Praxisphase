from __future__ import annotations

from dataclasses import dataclass
from typing import Any


TextOperation = dict[str, Any]


@dataclass(frozen=True)
class OperationIdentity:
    client_id: str
    op_id: str

    def tie_key(self) -> tuple[str, str]:
        return (self.client_id, self.op_id)


def clone_op(op: TextOperation) -> TextOperation:
    return dict(op)


def op_text_len(op: TextOperation) -> int:
    return len(str(op.get("text", "")))


def clamp_position(content: str, pos: int) -> int:
    return max(0, min(pos, len(content)))


def apply_operation(content: str, op: TextOperation) -> str:
    """Apply an already transformed operation to a Unicode Python string."""

    pos = clamp_position(content, int(op["pos"]))

    if op["type"] == "insert":
        text = str(op.get("text", ""))
        return content[:pos] + text + content[pos:]

    length = max(0, int(op.get("len", 0)))
    end = clamp_position(content, pos + length)
    return content[:pos] + content[end:]


def transform_operation(
    incoming: TextOperation,
    incoming_identity: OperationIdentity,
    accepted: TextOperation,
    accepted_identity: OperationIdentity,
) -> TextOperation | None:
    """Transform incoming operation A over already accepted operation B."""

    a = clone_op(incoming)
    b = accepted

    if a["type"] == "insert" and b["type"] == "insert":
        return transform_insert_insert(a, incoming_identity, b, accepted_identity)

    if a["type"] == "insert" and b["type"] == "delete":
        return transform_insert_delete(a, b)

    if a["type"] == "delete" and b["type"] == "insert":
        return transform_delete_insert(a, b)

    if a["type"] == "delete" and b["type"] == "delete":
        return transform_delete_delete(a, b)

    return a


def transform_insert_insert(
    incoming: TextOperation,
    incoming_identity: OperationIdentity,
    accepted: TextOperation,
    accepted_identity: OperationIdentity,
) -> TextOperation:
    a_pos = int(incoming["pos"])
    b_pos = int(accepted["pos"])

    if b_pos < a_pos or (
        b_pos == a_pos and accepted_identity.tie_key() < incoming_identity.tie_key()
    ):
        incoming["pos"] = a_pos + op_text_len(accepted)

    return incoming


def transform_insert_delete(incoming: TextOperation, accepted: TextOperation) -> TextOperation:
    a_pos = int(incoming["pos"])
    b_pos = int(accepted["pos"])
    b_len = int(accepted["len"])

    if b_pos < a_pos:
        incoming["pos"] = max(b_pos, a_pos - b_len)

    return incoming


def transform_delete_insert(incoming: TextOperation, accepted: TextOperation) -> TextOperation:
    a_pos = int(incoming["pos"])
    a_len = int(incoming["len"])
    b_pos = int(accepted["pos"])
    b_len = op_text_len(accepted)

    if b_pos <= a_pos:
        incoming["pos"] = a_pos + b_len
    elif a_pos < b_pos < a_pos + a_len:
        incoming["len"] = a_len + b_len

    return incoming


def transform_delete_delete(incoming: TextOperation, accepted: TextOperation) -> TextOperation | None:
    a_pos = int(incoming["pos"])
    a_len = int(incoming["len"])
    b_pos = int(accepted["pos"])
    b_len = int(accepted["len"])
    a_end = a_pos + a_len
    b_end = b_pos + b_len

    if b_end <= a_pos:
        incoming["pos"] = max(0, a_pos - b_len)
        return incoming

    if b_pos >= a_end:
        return incoming

    overlap_start = max(a_pos, b_pos)
    overlap_end = min(a_end, b_end)
    overlap = max(0, overlap_end - overlap_start)
    next_len = max(0, a_len - overlap)

    if next_len == 0:
        return None

    incoming["len"] = next_len
    if b_pos < a_pos:
        incoming["pos"] = b_pos

    return incoming


def transform_over_history(
    incoming: TextOperation,
    incoming_identity: OperationIdentity,
    history: list[tuple[TextOperation, OperationIdentity]],
) -> TextOperation | None:
    transformed: TextOperation | None = clone_op(incoming)

    for accepted, accepted_identity in history:
        if transformed is None:
            return None
        transformed = transform_operation(transformed, incoming_identity, accepted, accepted_identity)

    return transformed
