"""Unit tests for cursor and selection transformation utilities."""

from app.domain.collaboration.cursor_transform import (
    transform_cursor_position,
    transform_cursor_state,
    transform_selection_range,
)
from app.domain.collaboration.schemas import CursorState


def test_cursor_shifts_right_after_insert_before_it() -> None:
    """A cursor after an insert shifts right by the inserted text length."""

    result = transform_cursor_position(5, {"type": "insert", "pos": 2, "text": "abc"})

    assert result == 8


def test_cursor_inside_delete_collapses_to_delete_start() -> None:
    """A cursor inside a deleted range moves to the delete start."""

    result = transform_cursor_position(5, {"type": "delete", "pos": 3, "len": 4})

    assert result == 3


def test_selection_is_transformed_and_clamped() -> None:
    """Selection anchors are transformed independently and clamped."""

    result = transform_selection_range(
        2,
        12,
        {"type": "delete", "pos": 4, "len": 10},
        document_length=6,
    )

    assert result == (2, 4)


def test_cursor_state_preserves_identity_metadata() -> None:
    """Transforming a cursor state changes only coordinates."""

    cursor = CursorState(
        user_id="u1",
        client_id="c1",
        pos=5,
        selection_start=4,
        selection_end=6,
        color="#2563eb",
        display_name="Ada",
        ts="2026-05-20T10:00:00+00:00",
    )

    result = transform_cursor_state(
        cursor,
        {"type": "insert", "pos": 2, "text": "xy"},
        document_length=20,
    )

    assert result.user_id == cursor.user_id
    assert result.client_id == cursor.client_id
    assert result.pos == 7
    assert result.selection_start == 6
    assert result.selection_end == 8
