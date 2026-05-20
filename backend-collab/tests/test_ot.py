"""Unit tests for plain-text OT transformation and operation application."""

from app.ot import OperationIdentity, apply_operation, transform_operation


def identity(client: str, op: str) -> OperationIdentity:
    """Create an operation identity for deterministic test cases."""

    return OperationIdentity(client_id=client, op_id=op)


def test_insert_insert_shifts_after_prior_insert() -> None:
    """An insert after an accepted insert shifts right by inserted text length."""

    incoming = {"type": "insert", "pos": 3, "text": "A"}
    accepted = {"type": "insert", "pos": 1, "text": "xx"}

    result = transform_operation(incoming, identity("b", "2"), accepted, identity("a", "1"))

    assert result == {"type": "insert", "pos": 5, "text": "A"}


def test_insert_insert_uses_deterministic_tie_breaker() -> None:
    """Same-position inserts sort by the stable ``(client_id, op_id)`` key."""

    incoming = {"type": "insert", "pos": 0, "text": "B"}
    accepted = {"type": "insert", "pos": 0, "text": "A"}

    result = transform_operation(incoming, identity("b", "2"), accepted, identity("a", "1"))

    assert result == {"type": "insert", "pos": 1, "text": "B"}


def test_insert_insert_tie_breaker_keeps_smaller_identity_left() -> None:
    """A same-position insert with the smaller identity remains at its position."""

    incoming = {"type": "insert", "pos": 0, "text": "A"}
    accepted = {"type": "insert", "pos": 0, "text": "B"}

    result = transform_operation(incoming, identity("a", "1"), accepted, identity("b", "2"))

    assert result == {"type": "insert", "pos": 0, "text": "A"}


def test_insert_delete_moves_insert_left_or_to_delete_start() -> None:
    """An insert after or inside a delete moves to the post-delete coordinate."""

    incoming = {"type": "insert", "pos": 8, "text": "X"}
    accepted = {"type": "delete", "pos": 3, "len": 4}

    result = transform_operation(incoming, identity("b", "2"), accepted, identity("a", "1"))

    assert result == {"type": "insert", "pos": 4, "text": "X"}


def test_delete_insert_shifts_or_expands() -> None:
    """A delete shifts after an insert and expands when the insert lands inside."""

    shifted = transform_operation(
        {"type": "delete", "pos": 5, "len": 2},
        identity("b", "2"),
        {"type": "insert", "pos": 3, "text": "xx"},
        identity("a", "1"),
    )
    expanded = transform_operation(
        {"type": "delete", "pos": 3, "len": 5},
        identity("b", "3"),
        {"type": "insert", "pos": 5, "text": "yy"},
        identity("a", "1"),
    )

    assert shifted == {"type": "delete", "pos": 7, "len": 2}
    assert expanded == {"type": "delete", "pos": 3, "len": 7}


def test_delete_delete_clamps_overlap() -> None:
    """Partially overlapping deletes keep only the remaining undeleted span."""

    result = transform_operation(
        {"type": "delete", "pos": 5, "len": 5},
        identity("b", "2"),
        {"type": "delete", "pos": 2, "len": 5},
        identity("a", "1"),
    )

    assert result == {"type": "delete", "pos": 2, "len": 3}


def test_delete_delete_drops_fully_overlapped_delete() -> None:
    """A delete fully covered by an accepted delete becomes a no-op."""

    result = transform_operation(
        {"type": "delete", "pos": 5, "len": 2},
        identity("b", "2"),
        {"type": "delete", "pos": 3, "len": 6},
        identity("a", "1"),
    )

    assert result is None


def test_apply_operation_uses_python_code_points() -> None:
    """Operation application uses Python code points for Unicode text."""

    content = "a😀c"
    inserted = apply_operation(content, {"type": "insert", "pos": 2, "text": "b"})
    deleted = apply_operation(inserted, {"type": "delete", "pos": 1, "len": 1})

    assert inserted == "a😀bc"
    assert deleted == "abc"
