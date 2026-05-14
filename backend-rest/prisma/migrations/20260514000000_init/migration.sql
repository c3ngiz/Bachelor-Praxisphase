CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE "WorkspaceItemType" AS ENUM ('FOLDER', 'DOCUMENT');
CREATE TYPE "WorkspacePermission" AS ENUM ('READ', 'WRITE');

CREATE TABLE "users" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "email" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "avatarColor" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "workspace_items" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "type" "WorkspaceItemType" NOT NULL,
  "ownerId" UUID NOT NULL,
  "parentId" UUID,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "workspace_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "workspace_shares" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "itemId" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "permission" "WorkspacePermission" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "workspace_shares_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "document_contents" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "itemId" UUID NOT NULL,
  "content" JSONB NOT NULL DEFAULT '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb,
  "revision" INTEGER NOT NULL DEFAULT 1,
  "lastOpenedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "document_contents_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "workspace_items_deletedAt_idx" ON "workspace_items"("deletedAt");
CREATE INDEX "workspace_items_ownerId_idx" ON "workspace_items"("ownerId");
CREATE INDEX "workspace_items_parentId_idx" ON "workspace_items"("parentId");
CREATE INDEX "workspace_items_type_idx" ON "workspace_items"("type");
CREATE INDEX "workspace_items_parent_name_active_idx" ON "workspace_items"("parentId", "name") WHERE "deletedAt" IS NULL;
CREATE INDEX "workspace_items_owner_root_name_active_idx" ON "workspace_items"("ownerId", "name") WHERE "parentId" IS NULL AND "deletedAt" IS NULL;
CREATE UNIQUE INDEX "workspace_shares_itemId_userId_key" ON "workspace_shares"("itemId", "userId");
CREATE INDEX "workspace_shares_itemId_idx" ON "workspace_shares"("itemId");
CREATE INDEX "workspace_shares_userId_idx" ON "workspace_shares"("userId");
CREATE UNIQUE INDEX "document_contents_itemId_key" ON "document_contents"("itemId");
CREATE INDEX "document_contents_itemId_idx" ON "document_contents"("itemId");

ALTER TABLE "workspace_items"
  ADD CONSTRAINT "workspace_items_ownerId_fkey"
  FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "workspace_items"
  ADD CONSTRAINT "workspace_items_parentId_fkey"
  FOREIGN KEY ("parentId") REFERENCES "workspace_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "workspace_shares"
  ADD CONSTRAINT "workspace_shares_itemId_fkey"
  FOREIGN KEY ("itemId") REFERENCES "workspace_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "workspace_shares"
  ADD CONSTRAINT "workspace_shares_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "document_contents"
  ADD CONSTRAINT "document_contents_itemId_fkey"
  FOREIGN KEY ("itemId") REFERENCES "workspace_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
