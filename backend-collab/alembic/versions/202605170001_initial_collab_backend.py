"""Initial Python backend schema.

Revision ID: 202605170001
Revises:
Create Date: 2026-05-17
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "202605170001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create auth, workspace, document, and collaboration tables."""

    op.execute('CREATE EXTENSION IF NOT EXISTS "pgcrypto"')
    workspace_item_type = postgresql.ENUM("FOLDER", "DOCUMENT", name="WorkspaceItemType")
    workspace_permission = postgresql.ENUM("READ", "WRITE", name="WorkspacePermission")

    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("email", sa.String(length=254), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("passwordHash", sa.String(length=255), nullable=False),
        sa.Column("avatarColor", sa.String(length=64), nullable=True),
        sa.Column("createdAt", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updatedAt", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )
    op.create_index("ix_users_email", "users", ["email"])

    op.create_table(
        "workspace_items",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("type", workspace_item_type, nullable=False),
        sa.Column("ownerId", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("parentId", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("createdAt", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updatedAt", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("deletedAt", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["ownerId"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["parentId"], ["workspace_items.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("workspace_items_deletedAt_idx", "workspace_items", ["deletedAt"])
    op.create_index("workspace_items_ownerId_idx", "workspace_items", ["ownerId"])
    op.create_index("workspace_items_parentId_idx", "workspace_items", ["parentId"])
    op.create_index("workspace_items_type_idx", "workspace_items", ["type"])
    op.execute(
        'CREATE UNIQUE INDEX workspace_items_parent_name_active_key '
        'ON workspace_items ("parentId", name) '
        'WHERE "deletedAt" IS NULL AND "parentId" IS NOT NULL'
    )
    op.execute(
        'CREATE UNIQUE INDEX workspace_items_owner_root_name_active_key '
        'ON workspace_items ("ownerId", name) '
        'WHERE "deletedAt" IS NULL AND "parentId" IS NULL'
    )

    op.create_table(
        "workspace_shares",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("itemId", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("userId", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("permission", workspace_permission, nullable=False),
        sa.Column("createdAt", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updatedAt", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["itemId"], ["workspace_items.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["userId"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("workspace_shares_itemId_userId_key", "workspace_shares", ["itemId", "userId"], unique=True)
    op.create_index("workspace_shares_itemId_idx", "workspace_shares", ["itemId"])
    op.create_index("workspace_shares_userId_idx", "workspace_shares", ["userId"])

    op.create_table(
        "document_contents",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("itemId", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            "content",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text('\'{"type":"doc","content":[{"type":"paragraph"}]}\'::jsonb'),
            nullable=False,
        ),
        sa.Column("revision", sa.Integer(), server_default=sa.text("1"), nullable=False),
        sa.Column("lastOpenedAt", sa.DateTime(timezone=True), nullable=True),
        sa.Column("createdAt", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updatedAt", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["itemId"], ["workspace_items.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("itemId"),
    )
    op.create_index("document_contents_itemId_idx", "document_contents", ["itemId"])

    op.create_table(
        "collab_documents",
        sa.Column("doc_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("content", sa.Text(), server_default=sa.text("''"), nullable=False),
        sa.Column("version", sa.Integer(), server_default=sa.text("0"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["doc_id"], ["workspace_items.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("doc_id"),
    )

    op.create_table(
        "collab_operations",
        sa.Column("op_id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("doc_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("client_id", sa.String(length=120), nullable=False),
        sa.Column("base_version", sa.Integer(), nullable=False),
        sa.Column("raw_op", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("op", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("server_version", sa.Integer(), nullable=False),
        sa.Column("client_ts", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("transform_required", sa.Boolean(), nullable=False),
        sa.Column("transform_ms", sa.Float(), server_default=sa.text("0"), nullable=False),
        sa.ForeignKeyConstraint(["doc_id"], ["collab_documents.doc_id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("op_id"),
    )
    op.create_index(
        "collab_operations_doc_id_server_version_key",
        "collab_operations",
        ["doc_id", "server_version"],
        unique=True,
    )
    op.create_index("collab_operations_doc_id_idx", "collab_operations", ["doc_id"])
    op.create_index("collab_operations_client_id_idx", "collab_operations", ["client_id"])
    op.create_index("collab_operations_created_at_idx", "collab_operations", ["created_at"])

    op.create_table(
        "collab_snapshots",
        sa.Column("snapshot_id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("doc_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("version", sa.Integer(), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["doc_id"], ["collab_documents.doc_id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("snapshot_id"),
    )
    op.create_index("collab_snapshots_doc_id_version_idx", "collab_snapshots", ["doc_id", "version"])

    op.create_table(
        "collab_metric_events",
        sa.Column("event_id", postgresql.UUID(as_uuid=True), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("doc_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("event_type", sa.String(length=80), nullable=False),
        sa.Column("payload", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["doc_id"], ["collab_documents.doc_id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("event_id"),
    )
    op.create_index(
        "collab_metric_events_doc_id_event_type_idx",
        "collab_metric_events",
        ["doc_id", "event_type"],
    )
    op.create_index("collab_metric_events_created_at_idx", "collab_metric_events", ["created_at"])


def downgrade() -> None:
    """Drop all backend tables and enums."""

    op.drop_index("collab_metric_events_created_at_idx", table_name="collab_metric_events")
    op.drop_index("collab_metric_events_doc_id_event_type_idx", table_name="collab_metric_events")
    op.drop_table("collab_metric_events")
    op.drop_index("collab_snapshots_doc_id_version_idx", table_name="collab_snapshots")
    op.drop_table("collab_snapshots")
    op.drop_index("collab_operations_created_at_idx", table_name="collab_operations")
    op.drop_index("collab_operations_client_id_idx", table_name="collab_operations")
    op.drop_index("collab_operations_doc_id_idx", table_name="collab_operations")
    op.drop_index("collab_operations_doc_id_server_version_key", table_name="collab_operations")
    op.drop_table("collab_operations")
    op.drop_table("collab_documents")
    op.drop_index("document_contents_itemId_idx", table_name="document_contents")
    op.drop_table("document_contents")
    op.drop_index("workspace_shares_userId_idx", table_name="workspace_shares")
    op.drop_index("workspace_shares_itemId_idx", table_name="workspace_shares")
    op.drop_index("workspace_shares_itemId_userId_key", table_name="workspace_shares")
    op.drop_table("workspace_shares")
    op.execute("DROP INDEX IF EXISTS workspace_items_owner_root_name_active_key")
    op.execute("DROP INDEX IF EXISTS workspace_items_parent_name_active_key")
    op.drop_index("workspace_items_type_idx", table_name="workspace_items")
    op.drop_index("workspace_items_parentId_idx", table_name="workspace_items")
    op.drop_index("workspace_items_ownerId_idx", table_name="workspace_items")
    op.drop_index("workspace_items_deletedAt_idx", table_name="workspace_items")
    op.drop_table("workspace_items")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_table("users")
    postgresql.ENUM(name="WorkspacePermission").drop(op.get_bind(), checkfirst=True)
    postgresql.ENUM(name="WorkspaceItemType").drop(op.get_bind(), checkfirst=True)
