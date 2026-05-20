"""Compatibility re-exports for the plain-text collaboration OT primitives.

New collaboration code imports from ``app.domain.collaboration.operations`` and
``app.domain.collaboration.transform``. This module remains so existing tests,
examples, and scripts that import ``app.ot`` keep working.
"""

from __future__ import annotations

from app.domain.collaboration.operations import (
    OperationIdentity,
    TextOperation,
    apply_operation,
    clamp_position,
    clone_op,
    op_text_len,
)
from app.domain.collaboration.transform import (
    transform_delete_delete,
    transform_delete_insert,
    transform_insert_delete,
    transform_insert_insert,
    transform_operation,
    transform_over_history,
)

__all__ = [
    "OperationIdentity",
    "TextOperation",
    "apply_operation",
    "clamp_position",
    "clone_op",
    "op_text_len",
    "transform_delete_delete",
    "transform_delete_insert",
    "transform_insert_delete",
    "transform_insert_insert",
    "transform_operation",
    "transform_over_history",
]
