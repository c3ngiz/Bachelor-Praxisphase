-- Destructive workspace reset.
-- Preserves User rows, but removes old workspace/document/collaboration data.

DROP TABLE IF EXISTS "DocumentCollaborationState" CASCADE;
DROP TABLE IF EXISTS "Document" CASCADE;
DROP TABLE IF EXISTS "WorkspaceMember" CASCADE;
DROP TABLE IF EXISTS "Workspace" CASCADE;

DROP TYPE IF EXISTS "DocumentVisibility";
DROP TYPE IF EXISTS "WorkspaceRole";
DROP TYPE IF EXISTS "PermissionLevel";
DROP TYPE IF EXISTS "WorkspaceItemType";

CREATE TYPE "WorkspaceItemType" AS ENUM ('folder', 'document');
CREATE TYPE "PermissionLevel" AS ENUM ('read', 'write');

CREATE TABLE "WorkspaceItem" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" "WorkspaceItemType" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  "ownerId" TEXT NOT NULL,
  "parentId" TEXT,
  CONSTRAINT "WorkspaceItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Document" (
  "id" TEXT NOT NULL,
  "content" JSONB NOT NULL,
  "revision" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "lastOpenedAt" TIMESTAMP(3),
  "lastEditedById" TEXT NOT NULL,
  "lastEditedByName" TEXT NOT NULL,
  "lastEditedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WorkspaceItemCollaborator" (
  "id" TEXT NOT NULL,
  "permission" "PermissionLevel" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "itemId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  CONSTRAINT "WorkspaceItemCollaborator_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DocumentCollaborationState" (
  "documentId" TEXT NOT NULL,
  "yjsState" BYTEA NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DocumentCollaborationState_pkey" PRIMARY KEY ("documentId")
);

CREATE INDEX "WorkspaceItem_ownerId_idx" ON "WorkspaceItem"("ownerId");
CREATE INDEX "WorkspaceItem_parentId_idx" ON "WorkspaceItem"("parentId");
CREATE INDEX "WorkspaceItem_type_idx" ON "WorkspaceItem"("type");
CREATE INDEX "WorkspaceItem_deletedAt_idx" ON "WorkspaceItem"("deletedAt");
CREATE INDEX "WorkspaceItem_parentId_name_idx" ON "WorkspaceItem"("parentId", "name");

CREATE INDEX "Document_revision_idx" ON "Document"("revision");
CREATE INDEX "Document_updatedAt_idx" ON "Document"("updatedAt");
CREATE INDEX "Document_lastEditedById_idx" ON "Document"("lastEditedById");

CREATE INDEX "WorkspaceItemCollaborator_itemId_idx" ON "WorkspaceItemCollaborator"("itemId");
CREATE INDEX "WorkspaceItemCollaborator_userId_idx" ON "WorkspaceItemCollaborator"("userId");
CREATE UNIQUE INDEX "WorkspaceItemCollaborator_itemId_userId_key"
  ON "WorkspaceItemCollaborator"("itemId", "userId");

ALTER TABLE "WorkspaceItem"
  ADD CONSTRAINT "WorkspaceItem_ownerId_fkey"
  FOREIGN KEY ("ownerId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WorkspaceItem"
  ADD CONSTRAINT "WorkspaceItem_parentId_fkey"
  FOREIGN KEY ("parentId") REFERENCES "WorkspaceItem"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Document"
  ADD CONSTRAINT "Document_id_fkey"
  FOREIGN KEY ("id") REFERENCES "WorkspaceItem"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Document"
  ADD CONSTRAINT "Document_lastEditedById_fkey"
  FOREIGN KEY ("lastEditedById") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WorkspaceItemCollaborator"
  ADD CONSTRAINT "WorkspaceItemCollaborator_itemId_fkey"
  FOREIGN KEY ("itemId") REFERENCES "WorkspaceItem"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WorkspaceItemCollaborator"
  ADD CONSTRAINT "WorkspaceItemCollaborator_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DocumentCollaborationState"
  ADD CONSTRAINT "DocumentCollaborationState_documentId_fkey"
  FOREIGN KEY ("documentId") REFERENCES "Document"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
