"""Cursor and selection transformation utilities for plain-text OT.

Remote cursors are not document operations, but they live in the same coordinate
space. Applying the same position-shifting rules keeps presence markers stable
when inserts and deletes arrive concurrently with cursor updates.
"""

from __future__ import annotations

from app.domain.collaboration.operations import (
    TextOperation,
    clamp_index,
    op_delete_len,
    op_text_len,
)
from app.domain.collaboration.schemas import CursorState


def transform_cursor_position(
    position: int,
    op: TextOperation,
    *,
    document_length: int | None = None,
) -> int:
    """Transform one cursor position after an insert or delete operation.

    Example:
        A cursor at position ``5`` becomes ``8`` after inserting ``"abc"`` at
        position ``2``. A cursor inside a deleted range collapses to the delete
        start. The optional ``document_length`` clamps the result to the current
        post-operation document length.
    """

    next_position = max(0, position)

    if op["type"] == "insert":
        insert_pos = int(op["pos"])
        if insert_pos <= next_position:
            next_position += op_text_len(op)
    else:
        delete_pos = int(op["pos"])
        delete_len = op_delete_len(op)
        delete_end = delete_pos + delete_len

        if delete_pos >= next_position:
            next_position = next_position
        elif next_position <= delete_end:
            next_position = delete_pos
        else:
            next_position = max(delete_pos, next_position - delete_len)

    if document_length is None:
        return next_position

    return clamp_index(next_position, document_length)


def transform_selection_range(
    selection_start: int,
    selection_end: int,
    op: TextOperation,
    *,
    document_length: int | None = None,
) -> tuple[int, int]:
    """Transform and normalize a selection range after an operation."""

    start = transform_cursor_position(selection_start, op, document_length=document_length)
    end = transform_cursor_position(selection_end, op, document_length=document_length)
    return (min(start, end), max(start, end))


def transform_cursor_state(
    cursor: CursorState,
    op: TextOperation,
    *,
    document_length: int | None = None,
) -> CursorState:
    """Return a cursor state shifted into the post-operation document.

    The cursor head and selection anchors are transformed independently and then
    clamped to the supplied document length. The timestamp and identity metadata
    are preserved because this utility only changes coordinates.
    """

    selection_start, selection_end = transform_selection_range(
        cursor.selection_start,
        cursor.selection_end,
        op,
        document_length=document_length,
    )
    return cursor.model_copy(
        update={
            "pos": transform_cursor_position(cursor.pos, op, document_length=document_length),
            "selection_start": selection_start,
            "selection_end": selection_end,
        }
    )
