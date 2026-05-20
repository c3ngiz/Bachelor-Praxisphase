"""REST collaboration diagnostics, hash checking, and resync endpoints."""

from __future__ import annotations

import csv
from io import StringIO

from fastapi import APIRouter
from fastapi.responses import PlainTextResponse

from app.common.dependencies import CurrentUser, DbSession
from app.domain.collaboration.schemas import (
    CollaborationHashCheckRequest,
    CollaborationHashCheckResponse,
    CollaborationMetricsResponse,
    CollaborationSnapshotResponse,
)
from app.domain.collaboration.service import CollaborationQueryService

router = APIRouter(prefix="/collaboration", tags=["collaboration"])


@router.get(
    "/documents/{document_id}/snapshot",
    response_model=CollaborationSnapshotResponse,
)
async def get_collaboration_snapshot(
    current_user: CurrentUser,
    db: DbSession,
    document_id: str,
) -> CollaborationSnapshotResponse:
    """Return the latest server-owned plain-text snapshot for resync."""

    return await CollaborationQueryService(db).get_snapshot(str(current_user.id), document_id)


@router.post(
    "/documents/{document_id}/hash-check",
    response_model=CollaborationHashCheckResponse,
)
async def check_collaboration_hash(
    current_user: CurrentUser,
    db: DbSession,
    document_id: str,
    input: CollaborationHashCheckRequest,
) -> CollaborationHashCheckResponse:
    """Compare a client text hash against the current server snapshot."""

    return await CollaborationQueryService(db).compare_hash(
        str(current_user.id),
        document_id,
        client_version=input.version,
        client_hash=input.hash,
    )


@router.get(
    "/documents/{document_id}/metrics",
    response_model=CollaborationMetricsResponse,
)
async def get_collaboration_metrics(
    current_user: CurrentUser,
    db: DbSession,
    document_id: str,
) -> CollaborationMetricsResponse:
    """Return persisted collaboration metrics for one accessible document."""

    return await CollaborationQueryService(db).get_metrics(str(current_user.id), document_id)


@router.get(
    "/documents/{document_id}/metrics.csv",
    response_class=PlainTextResponse,
)
async def get_collaboration_metrics_csv(
    current_user: CurrentUser,
    db: DbSession,
    document_id: str,
) -> str:
    """Return one document's metrics as a CSV-friendly response."""

    metrics = await CollaborationQueryService(db).get_metrics(str(current_user.id), document_id)
    buffer = StringIO()
    writer = csv.writer(buffer)
    writer.writerow(
        [
            "document_id",
            "version",
            "content_length",
            "total_operations_sent",
            "acknowledged_operations",
            "remote_operations_received",
            "transformed_operations",
            "insert_insert",
            "insert_delete",
            "delete_insert",
            "delete_delete",
            "avg_ack_latency_ms",
            "avg_server_processing_ms",
            "divergence_events",
            "last_operation_at",
        ]
    )
    writer.writerow(
        [
            metrics.document_id,
            metrics.version,
            metrics.content_length,
            metrics.total_operations_sent,
            metrics.acknowledged_operations,
            metrics.remote_operations_received,
            metrics.transformed_operations,
            metrics.transform_case_counts.insert_insert,
            metrics.transform_case_counts.insert_delete,
            metrics.transform_case_counts.delete_insert,
            metrics.transform_case_counts.delete_delete,
            metrics.avg_ack_latency_ms,
            metrics.avg_server_processing_ms,
            metrics.divergence_events,
            metrics.last_operation_at,
        ]
    )
    return buffer.getvalue()
