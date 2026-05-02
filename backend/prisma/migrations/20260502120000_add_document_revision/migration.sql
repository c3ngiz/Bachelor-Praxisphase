ALTER TABLE "Document" ADD COLUMN "revision" INTEGER NOT NULL DEFAULT 1;

CREATE INDEX "Document_revision_idx" ON "Document"("revision");
