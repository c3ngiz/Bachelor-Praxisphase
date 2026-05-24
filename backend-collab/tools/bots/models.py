"""Shared data models for bot identity, metrics, and scenario reporting.

The harness keeps these models deliberately small and JSON-friendly. REST and
WebSocket payloads remain dictionaries because the project contracts already
exist in the backend and frontend; these dataclasses only describe bot-side
state and final report structure.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any


JsonObject = dict[str, Any]


def utc_timestamp() -> str:
    """Return an ISO-8601 UTC timestamp used in names and reports."""

    return datetime.now(timezone.utc).isoformat()


@dataclass(frozen=True)
class BotAccount:
    """Deterministic development account credentials for one bot."""

    email: str
    password: str
    name: str


@dataclass(frozen=True)
class AuthenticatedBot:
    """Authenticated bot session returned by REST sign-up or login."""

    account: BotAccount
    token: str
    user_id: str
    email: str
    name: str
    created: bool

    def to_report(self) -> JsonObject:
        """Serialize non-secret authentication details for reports."""

        return {
            "userId": self.user_id,
            "email": self.email,
            "name": self.name,
            "created": self.created,
        }


@dataclass(frozen=True)
class WorkspaceArtifacts:
    """Workspace objects created by the owner bot for one harness run."""

    folder_id: str
    folder_name: str
    document_id: str
    document_name: str

    def to_report(self) -> JsonObject:
        """Serialize workspace ids and labels for reports."""

        return {
            "folderId": self.folder_id,
            "folderName": self.folder_name,
            "documentId": self.document_id,
            "documentName": self.document_name,
        }


@dataclass
class ClientMetrics:
    """Client-side WebSocket metrics gathered by one collaboration bot."""

    operations_sent: int = 0
    acknowledgements_received: int = 0
    remote_operations_received: int = 0
    ack_latencies_ms: list[float] = field(default_factory=list)
    convergence_latencies_ms: list[float] = field(default_factory=list)

    @property
    def average_ack_latency_ms(self) -> float | None:
        """Return the average acknowledgement latency for sent operations."""

        if not self.ack_latencies_ms:
            return None

        return sum(self.ack_latencies_ms) / len(self.ack_latencies_ms)

    @property
    def average_convergence_ms(self) -> float | None:
        """Return the average measured convergence wait time."""

        if not self.convergence_latencies_ms:
            return None

        return sum(self.convergence_latencies_ms) / len(self.convergence_latencies_ms)

    def to_report(self) -> JsonObject:
        """Serialize client metrics with compact floating-point values."""

        return {
            "operationsSent": self.operations_sent,
            "acksReceived": self.acknowledgements_received,
            "remoteOperationsReceived": self.remote_operations_received,
            "averageAckLatencyMs": _round_optional(self.average_ack_latency_ms),
            "averageConvergenceMs": _round_optional(self.average_convergence_ms),
        }

    def absorb(self, other: "ClientMetrics") -> None:
        """Merge metrics from a previous socket session for the same logical bot."""

        self.operations_sent += other.operations_sent
        self.acknowledgements_received += other.acknowledgements_received
        self.remote_operations_received += other.remote_operations_received
        self.ack_latencies_ms.extend(other.ack_latencies_ms)
        self.convergence_latencies_ms.extend(other.convergence_latencies_ms)


@dataclass
class CheckResult:
    """One named assertion made by the scenario runner."""

    name: str
    passed: bool
    detail: str | None = None

    def to_report(self) -> JsonObject:
        """Serialize one check result for the structured report."""

        body: JsonObject = {"name": self.name, "passed": self.passed}

        if self.detail:
            body["detail"] = self.detail

        return body


@dataclass
class ScenarioReport:
    """Structured output produced by the end-to-end collaboration scenario."""

    started_at: str = field(default_factory=utc_timestamp)
    finished_at: str | None = None
    passed: bool = False
    error: str | None = None
    auth: JsonObject = field(default_factory=dict)
    workspace: JsonObject = field(default_factory=dict)
    sharing: JsonObject = field(default_factory=dict)
    websocket: JsonObject = field(default_factory=dict)
    checks: list[CheckResult] = field(default_factory=list)
    final_content: str = ""
    final_hash: str = ""
    server_metrics: JsonObject = field(default_factory=dict)
    client_metrics: JsonObject = field(default_factory=dict)

    def add_check(self, name: str, passed: bool, detail: str | None = None) -> None:
        """Append a named pass/fail check and update the aggregate status."""

        self.checks.append(CheckResult(name=name, passed=passed, detail=detail))

    def finish(self, *, passed: bool, error: str | None = None) -> None:
        """Mark the report complete."""

        self.finished_at = utc_timestamp()
        self.passed = passed
        self.error = error

    def to_report(self) -> JsonObject:
        """Return a stable JSON-serializable representation."""

        body: JsonObject = {
            "startedAt": self.started_at,
            "finishedAt": self.finished_at,
            "passed": self.passed,
            "auth": self.auth,
            "workspace": self.workspace,
            "sharing": self.sharing,
            "websocket": self.websocket,
            "checks": [check.to_report() for check in self.checks],
            "finalContent": self.final_content,
            "finalHash": self.final_hash,
            "serverMetrics": self.server_metrics,
            "clientMetrics": self.client_metrics,
        }

        if self.error:
            body["error"] = self.error

        return body


def _round_optional(value: float | None) -> float | None:
    """Round optional timing values for readable JSON output."""

    return round(value, 2) if value is not None else None
