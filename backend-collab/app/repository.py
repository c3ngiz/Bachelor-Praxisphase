from __future__ import annotations

import json
from datetime import datetime
from typing import Any
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

import asyncpg

from .models import AcceptedOperation, DocumentSnapshot, UserSession, WorkspaceAccess


class CollaborationRepository:
    """PostgreSQL persistence and workspace permission queries."""

    def __init__(self, database_url: str) -> None:
        self.database_url = normalize_asyncpg_database_url(database_url)
        self.pool: asyncpg.Pool | None = None

    async def connect(self) -> None:
        self.pool = await asyncpg.create_pool(self.database_url, min_size=1, max_size=10)

    async def close(self) -> None:
        if self.pool:
            await self.pool.close()

    def require_pool(self) -> asyncpg.Pool:
        if not self.pool:
            raise RuntimeError("Database pool is not initialized.")
        return self.pool

    async def get_user(self, user_id: str) -> UserSession | None:
        row = await self.require_pool().fetchrow(
            """
            SELECT id::text, email, name, "avatarColor"
            FROM users
            WHERE id = $1::uuid
            """,
            user_id,
        )

        if not row:
            return None

        return UserSession(
            user_id=row["id"],
            email=row["email"],
            name=row["name"],
            avatar_color=row["avatarColor"],
        )

    async def resolve_workspace_access(self, user_id: str, doc_id: str) -> WorkspaceAccess | None:
        item = await self.require_pool().fetchrow(
            """
            SELECT id::text, name, "ownerId"::text, "parentId"::text
            FROM workspace_items
            WHERE id = $1::uuid
              AND type = 'DOCUMENT'
              AND "deletedAt" IS NULL
            """,
            doc_id,
        )

        if not item:
            return None

        if item["ownerId"] == user_id:
            return WorkspaceAccess(doc_id=item["id"], title=item["name"], permission="owner")

        direct_permission = await self.load_direct_permission(user_id, item["id"])
        best_permission = direct_permission
        parent_id = item["parentId"]
        seen: set[str] = set()

        while parent_id and parent_id not in seen:
            seen.add(parent_id)
            ancestor = await self.require_pool().fetchrow(
                """
                SELECT id::text, "ownerId"::text, "parentId"::text
                FROM workspace_items
                WHERE id = $1::uuid
                  AND type = 'FOLDER'
                  AND "deletedAt" IS NULL
                """,
                parent_id,
            )

            if not ancestor:
                break

            if ancestor["ownerId"] == user_id:
                best_permission = self.max_permission(best_permission, "WRITE")
            else:
                inherited_permission = await self.load_direct_permission(user_id, ancestor["id"])
                best_permission = self.max_permission(best_permission, inherited_permission)

            parent_id = ancestor["parentId"]

        if not best_permission:
            return None

        return WorkspaceAccess(
            doc_id=item["id"],
            title=item["name"],
            permission="write" if best_permission == "WRITE" else "read",
        )

    async def load_direct_permission(self, user_id: str, item_id: str) -> str | None:
        row = await self.require_pool().fetchrow(
            """
            SELECT permission::text
            FROM workspace_shares
            WHERE "itemId" = $1::uuid AND "userId" = $2::uuid
            """,
            item_id,
            user_id,
        )
        return row["permission"] if row else None

    def max_permission(self, current: str | None, next_value: str | None) -> str | None:
        if current == "WRITE" or next_value == "WRITE":
            return "WRITE"
        return current or next_value

    async def get_or_create_document(self, doc_id: str) -> DocumentSnapshot:
        pool = self.require_pool()

        existing = await pool.fetchrow(
            """
            SELECT doc_id::text, content, version, updated_at
            FROM collab_documents
            WHERE doc_id = $1::uuid
            """,
            doc_id,
        )

        if existing:
            return self.snapshot_from_row(existing)

        initial_content = await self.load_initial_plain_text(doc_id)

        row = await pool.fetchrow(
            """
            INSERT INTO collab_documents (doc_id, content, version)
            VALUES ($1::uuid, $2, 0)
            ON CONFLICT (doc_id) DO UPDATE SET doc_id = EXCLUDED.doc_id
            RETURNING doc_id::text, content, version, updated_at
            """,
            doc_id,
            initial_content,
        )
        return self.snapshot_from_row(row)

    async def load_initial_plain_text(self, doc_id: str) -> str:
        row = await self.require_pool().fetchrow(
            """
            SELECT content
            FROM document_contents
            WHERE "itemId" = $1::uuid
            """,
            doc_id,
        )

        if not row:
            return ""

        return extract_tiptap_text(parse_json_value(row["content"]))

    async def operations_since(self, doc_id: str, base_version: int) -> list[AcceptedOperation]:
        rows = await self.require_pool().fetch(
            """
            SELECT op_id::text, client_id, op, server_version
            FROM collab_operations
            WHERE doc_id = $1::uuid AND server_version > $2
            ORDER BY server_version ASC
            """,
            doc_id,
            base_version,
        )
        return [operation_from_row(row) for row in rows]

    async def operation_by_id(self, op_id: str) -> AcceptedOperation | None:
        row = await self.require_pool().fetchrow(
            """
            SELECT op_id::text, client_id, op, server_version
            FROM collab_operations
            WHERE op_id = $1::uuid
            """,
            op_id,
        )
        return operation_from_row(row) if row else None

    async def persist_operation(
        self,
        *,
        doc_id: str,
        user_id: str,
        client_id: str,
        op_id: str,
        base_version: int,
        raw_op: dict[str, Any],
        op: dict[str, Any],
        server_version: int,
        content: str,
        client_ts: datetime | None,
        transform_required: bool,
        transform_ms: float,
    ) -> None:
        async with self.require_pool().acquire() as connection:
            async with connection.transaction():
                await connection.execute(
                    """
                    UPDATE collab_documents
                    SET content = $2, version = $3, updated_at = now()
                    WHERE doc_id = $1::uuid
                    """,
                    doc_id,
                    content,
                    server_version,
                )
                await connection.execute(
                    """
                    INSERT INTO collab_operations (
                      op_id, doc_id, user_id, client_id, base_version, raw_op, op,
                      server_version, client_ts, transform_required, transform_ms
                    )
                    VALUES (
                      $1::uuid, $2::uuid, $3::uuid, $4, $5, $6::jsonb, $7::jsonb,
                      $8, $9, $10, $11
                    )
                    """,
                    op_id,
                    doc_id,
                    user_id,
                    client_id,
                    base_version,
                    json.dumps(raw_op),
                    json.dumps(op),
                    server_version,
                    client_ts,
                    transform_required,
                    transform_ms,
                )

    async def persist_snapshot(self, doc_id: str, version: int, content: str) -> None:
        await self.require_pool().execute(
            """
            INSERT INTO collab_snapshots (doc_id, version, content)
            VALUES ($1::uuid, $2, $3)
            """,
            doc_id,
            version,
            content,
        )

    async def record_metric(
        self, doc_id: str, event_type: str, payload: dict[str, Any]
    ) -> None:
        await self.require_pool().execute(
            """
            INSERT INTO collab_metric_events (doc_id, event_type, payload)
            VALUES ($1::uuid, $2, $3::jsonb)
            """,
            doc_id,
            event_type,
            json.dumps(payload),
        )

    async def metrics_summary(self) -> list[dict[str, Any]]:
        rows = await self.require_pool().fetch(
            """
            SELECT
              d.doc_id::text,
              d.version,
              length(d.content) AS content_length,
              count(o.op_id)::int AS operation_count,
              coalesce(sum(CASE WHEN o.transform_required THEN 1 ELSE 0 END), 0)::int
                AS transformed_operation_count,
              coalesce(avg(o.transform_ms), 0)::float AS avg_transform_ms,
              max(o.created_at) AS last_operation_at
            FROM collab_documents d
            LEFT JOIN collab_operations o ON o.doc_id = d.doc_id
            GROUP BY d.doc_id, d.version, d.content
            ORDER BY max(d.updated_at) DESC
            """
        )
        return [dict(row) for row in rows]

    def snapshot_from_row(self, row: asyncpg.Record) -> DocumentSnapshot:
        return DocumentSnapshot(
            doc_id=row["doc_id"],
            content=row["content"],
            version=row["version"],
            updated_at=row["updated_at"],
        )


def operation_from_row(row: asyncpg.Record) -> AcceptedOperation:
    return AcceptedOperation(
        op_id=row["op_id"],
        client_id=row["client_id"],
        op=parse_json_value(row["op"]),
        server_version=row["server_version"],
    )


def parse_json_value(value: Any) -> Any:
    if isinstance(value, str):
        return json.loads(value)
    return value


def extract_tiptap_text(node: Any) -> str:
    if not isinstance(node, dict):
        return ""

    node_type = node.get("type")

    if node_type == "text":
        return str(node.get("text", ""))

    children = node.get("content")
    if not isinstance(children, list):
        return ""

    rendered_children = [extract_tiptap_text(child) for child in children]

    if node_type in {"doc"}:
        return "\n".join(part for part in rendered_children if part)

    if node_type in {"paragraph", "heading", "listItem"}:
        return "".join(rendered_children)

    if node_type in {"bulletList", "orderedList"}:
        return "\n".join(part for part in rendered_children if part)

    return "".join(rendered_children)


def normalize_asyncpg_database_url(database_url: str) -> str:
    """Remove Prisma-only URL options that asyncpg does not understand."""

    parsed = urlsplit(database_url)
    query = [
        (key, value)
        for key, value in parse_qsl(parsed.query, keep_blank_values=True)
        if key != "schema"
    ]
    return urlunsplit((parsed.scheme, parsed.netloc, parsed.path, urlencode(query), parsed.fragment))
