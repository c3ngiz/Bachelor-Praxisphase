"""Lightweight metrics helpers for the plain-text collaboration engine.

Metrics are intentionally separate from the pure transformation functions. The
room records operational counters, while this module provides transform-case
counting and CSV-friendly metric payload helpers for thesis measurements.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Literal

from app.domain.collaboration.operations import OperationIdentity, TextOperation
from app.domain.collaboration.transform import transform_operation

TransformCase = Literal["insert/insert", "insert/delete", "delete/insert", "delete/delete"]
TRANSFORM_CASES: tuple[TransformCase, ...] = (
    "insert/insert",
    "insert/delete",
    "delete/insert",
    "delete/delete",
)


def empty_transform_case_counts() -> dict[TransformCase, int]:
    """Return a zero-filled transform-case counter dictionary."""

    return {case: 0 for case in TRANSFORM_CASES}


def transform_case(incoming: TextOperation, accepted: TextOperation) -> TransformCase:
    """Return the transform case name for two valid text operations."""

    return f"{incoming['type']}/{accepted['type']}"  # type: ignore[return-value]


@dataclass
class TransformMetrics:
    """Counters collected while transforming one operation over history."""

    case_counts: dict[TransformCase, int] = field(default_factory=empty_transform_case_counts)

    @property
    def transformed_step_count(self) -> int:
        """Return the number of pairwise transform steps observed."""

        return sum(self.case_counts.values())

    def record(self, case: TransformCase) -> None:
        """Increment one transform-case counter."""

        self.case_counts[case] += 1

    def to_payload(self) -> dict[str, int]:
        """Return a JSON-serializable transform-case counter payload."""

        return dict(self.case_counts)


@dataclass
class TransformResult:
    """Operation plus metrics returned by a metric-aware history transform."""

    op: TextOperation | None
    metrics: TransformMetrics


def transform_over_history_with_metrics(
    incoming: TextOperation,
    incoming_identity: OperationIdentity,
    history: list[tuple[TextOperation, OperationIdentity]],
) -> TransformResult:
    """Transform one operation over history while counting transform cases."""

    metrics = TransformMetrics()
    transformed: TextOperation | None = dict(incoming)

    for accepted, accepted_identity in history:
        if transformed is None:
            break
        metrics.record(transform_case(transformed, accepted))
        transformed = transform_operation(
            transformed,
            incoming_identity,
            accepted,
            accepted_identity,
        )

    return TransformResult(op=transformed, metrics=metrics)


@dataclass
class RoomMetrics:
    """In-memory room-level counters for active WebSocket sessions."""

    total_operations_sent: int = 0
    acknowledged_operations: int = 0
    remote_operations_received: int = 0
    transformed_operations: int = 0
    transform_case_counts: dict[TransformCase, int] = field(default_factory=empty_transform_case_counts)
    server_processing_samples_ms: list[float] = field(default_factory=list)

    def record_operation_sent(self) -> None:
        """Count a client operation submitted to the room."""

        self.total_operations_sent += 1

    def record_acknowledgement(self) -> None:
        """Count an acknowledgement sent back to a client."""

        self.acknowledged_operations += 1

    def record_remote_delivery(self, recipient_count: int) -> None:
        """Count accepted-operation deliveries to non-origin clients."""

        self.remote_operations_received += max(0, recipient_count)

    def record_transform(
        self,
        *,
        transform_required: bool,
        case_counts: dict[TransformCase, int],
        server_processing_ms: float,
    ) -> None:
        """Merge transform counters and server processing latency into the room."""

        if transform_required:
            self.transformed_operations += 1

        for case in TRANSFORM_CASES:
            self.transform_case_counts[case] += int(case_counts.get(case, 0))

        self.server_processing_samples_ms = [
            *self.server_processing_samples_ms[-99:],
            max(0.0, server_processing_ms),
        ]

    @property
    def avg_server_processing_ms(self) -> float | None:
        """Return the rolling average server processing time in milliseconds."""

        if not self.server_processing_samples_ms:
            return None
        return sum(self.server_processing_samples_ms) / len(self.server_processing_samples_ms)

    def to_payload(self) -> dict[str, object]:
        """Return a JSON-serializable active-room metrics snapshot."""

        return {
            "total_operations_sent": self.total_operations_sent,
            "acknowledged_operations": self.acknowledged_operations,
            "remote_operations_received": self.remote_operations_received,
            "transformed_operations": self.transformed_operations,
            "transform_case_counts": dict(self.transform_case_counts),
            "avg_server_processing_ms": self.avg_server_processing_ms,
        }
