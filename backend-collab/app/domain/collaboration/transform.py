"""Inclusion transformation rules for plain-text insert/delete operations.

The server accepts operations in a single version sequence. When a client sends
an operation based on an older version, the operation is transformed over every
accepted operation that the client missed. These functions are pure and do not
record metrics or touch persistence, so tests and thesis examples can reason
about OT behavior without WebSocket or database setup.
"""

from __future__ import annotations

from app.domain.collaboration.operations import (
    OperationIdentity,
    TextOperation,
    clone_op,
    op_delete_len,
    op_text_len,
)


def transform_operation(
    incoming: TextOperation,
    incoming_identity: OperationIdentity,
    accepted: TextOperation,
    accepted_identity: OperationIdentity,
) -> TextOperation | None:
    """Transform incoming operation A over already accepted operation B.

    Returning ``None`` means the incoming delete was fully covered by an accepted
    delete and has no remaining effect. Insert/insert ties are deterministic:
    the smaller ``(client_id, op_id)`` key stays left, the larger key shifts
    right by the accepted insert length.
    """

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
    """Transform an insert over a previously accepted insert.

    Inserts after the accepted insert shift right. Same-position inserts use the
    documented identity tie-breaker, which makes the final text independent of
    network timing for equal-position concurrent inserts.
    """

    a_pos = int(incoming["pos"])
    b_pos = int(accepted["pos"])

    if b_pos < a_pos or (
        b_pos == a_pos and accepted_identity.tie_key() < incoming_identity.tie_key()
    ):
        incoming["pos"] = a_pos + op_text_len(accepted)

    return incoming


def transform_insert_delete(incoming: TextOperation, accepted: TextOperation) -> TextOperation:
    """Transform an insert over a previously accepted delete.

    Inserts after the deleted range move left by the delete length. Inserts
    inside the deleted range collapse to the delete start, which is the stable
    insertion point in the post-delete document.
    """

    a_pos = int(incoming["pos"])
    b_pos = int(accepted["pos"])
    b_len = op_delete_len(accepted)

    if b_pos < a_pos:
        incoming["pos"] = max(b_pos, a_pos - b_len)

    return incoming


def transform_delete_insert(incoming: TextOperation, accepted: TextOperation) -> TextOperation:
    """Transform a delete over a previously accepted insert.

    Deletes after the insert shift right. If an accepted insert lands inside the
    incoming delete range, the delete expands so it still removes the originally
    intended characters around the inserted text.
    """

    a_pos = int(incoming["pos"])
    a_len = op_delete_len(incoming)
    b_pos = int(accepted["pos"])
    b_len = op_text_len(accepted)

    if b_pos <= a_pos:
        incoming["pos"] = a_pos + b_len
    elif a_pos < b_pos < a_pos + a_len:
        incoming["len"] = a_len + b_len

    return incoming


def transform_delete_delete(incoming: TextOperation, accepted: TextOperation) -> TextOperation | None:
    """Transform a delete over a previously accepted delete.

    The overlapping portion has already been removed by the accepted delete, so
    the incoming delete length is reduced by the overlap. A fully covered delete
    becomes ``None``. Partial overlap on the left moves the incoming delete to
    the accepted delete's start in the post-delete document.
    """

    a_pos = int(incoming["pos"])
    a_len = op_delete_len(incoming)
    b_pos = int(accepted["pos"])
    b_len = op_delete_len(accepted)
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
    """Transform one incoming operation over accepted operations in version order."""

    transformed: TextOperation | None = clone_op(incoming)

    for accepted, accepted_identity in history:
        if transformed is None:
            return None
        transformed = transform_operation(transformed, incoming_identity, accepted, accepted_identity)

    return transformed
