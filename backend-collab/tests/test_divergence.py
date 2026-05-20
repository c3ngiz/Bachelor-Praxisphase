"""Unit tests for stable text hashing and divergence comparison."""

from app.domain.collaboration.divergence import compare_document_hash, stable_text_hash


def test_stable_text_hash_uses_utf8_bytes() -> None:
    """Stable hashes include UTF-8 byte length for Unicode text."""

    assert stable_text_hash("a😀") == "fnv1a32:5:a0d90531"


def test_compare_document_hash_detects_version_or_hash_mismatch() -> None:
    """Divergence comparison requires both version and hash to match."""

    client_hash = stable_text_hash("hello")

    matching = compare_document_hash(
        document_id="doc-1",
        server_content="hello",
        server_version=3,
        client_version=3,
        client_hash=client_hash,
    )
    mismatched = compare_document_hash(
        document_id="doc-1",
        server_content="hello!",
        server_version=4,
        client_version=3,
        client_hash=client_hash,
    )

    assert matching.in_sync is True
    assert mismatched.in_sync is False
    assert mismatched.version_matches is False
    assert mismatched.hash_matches is False
