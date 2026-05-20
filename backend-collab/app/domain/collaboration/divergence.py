"""Stable content hashing and divergence comparison helpers.

The hash is deliberately independent of Python's randomized ``hash`` function.
It uses FNV-1a over UTF-8 bytes and includes the byte length in the returned
string. This is fast enough for periodic editor checks and easy to reproduce in
the TypeScript client without browser-specific binary formatting differences.
"""

from __future__ import annotations

from dataclasses import dataclass

FNV1A_32_OFFSET = 2166136261
FNV1A_32_PRIME = 16777619


def stable_text_hash(content: str) -> str:
    """Return a stable UTF-8 FNV-1a hash for plain-text document content."""

    encoded = content.encode("utf-8")
    value = FNV1A_32_OFFSET

    for byte in encoded:
        value ^= byte
        value = (value * FNV1A_32_PRIME) & 0xFFFFFFFF

    return f"fnv1a32:{len(encoded)}:{value:08x}"


@dataclass(frozen=True)
class DivergenceComparison:
    """Result of comparing a client document hash with the server snapshot."""

    document_id: str
    version: int
    client_version: int
    server_hash: str
    client_hash: str
    in_sync: bool
    version_matches: bool
    hash_matches: bool


def compare_document_hash(
    *,
    document_id: str,
    server_content: str,
    server_version: int,
    client_version: int,
    client_hash: str,
) -> DivergenceComparison:
    """Compare one client hash against the current server text and version."""

    server_hash = stable_text_hash(server_content)
    version_matches = server_version == client_version
    hash_matches = server_hash == client_hash
    return DivergenceComparison(
        document_id=document_id,
        version=server_version,
        client_version=client_version,
        server_hash=server_hash,
        client_hash=client_hash,
        in_sync=version_matches and hash_matches,
        version_matches=version_matches,
        hash_matches=hash_matches,
    )
