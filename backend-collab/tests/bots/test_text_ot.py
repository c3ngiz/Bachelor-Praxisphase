"""Unit tests for the collaboration bot text model helpers."""

from tools.bots.text_ot import apply_delete, apply_insert, apply_operation, content_hash


def test_apply_insert_delete_and_operation() -> None:
    """Bot helper operations use the same clamped string semantics as the backend."""

    content = apply_insert("ac", 1, "b")
    assert content == "abc"
    assert apply_delete(content, 1, 1) == "ac"
    assert apply_operation(content, {"type": "insert", "pos": 99, "text": "!"}) == "abc!"
    assert apply_operation(content, {"type": "delete", "pos": 2, "len": 99}) == "ab"


def test_content_hash_is_stable() -> None:
    """The bot hash format matches the backend divergence checker contract."""

    assert content_hash("") == "fnv1a32:0:811c9dc5"
    assert content_hash("hello") == "fnv1a32:5:4f9f2cab"

