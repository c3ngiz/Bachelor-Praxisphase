CREATE TABLE "collab_documents" (
  "doc_id" UUID NOT NULL,
  "content" TEXT NOT NULL DEFAULT '',
  "version" INTEGER NOT NULL DEFAULT 0,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "collab_documents_pkey" PRIMARY KEY ("doc_id")
);

CREATE TABLE "collab_operations" (
  "op_id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "doc_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "client_id" TEXT NOT NULL,
  "base_version" INTEGER NOT NULL,
  "raw_op" JSONB NOT NULL,
  "op" JSONB NOT NULL,
  "server_version" INTEGER NOT NULL,
  "client_ts" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "transform_required" BOOLEAN NOT NULL,
  "transform_ms" DOUBLE PRECISION NOT NULL DEFAULT 0,
  CONSTRAINT "collab_operations_pkey" PRIMARY KEY ("op_id")
);

CREATE TABLE "collab_snapshots" (
  "snapshot_id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "doc_id" UUID NOT NULL,
  "version" INTEGER NOT NULL,
  "content" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "collab_snapshots_pkey" PRIMARY KEY ("snapshot_id")
);

CREATE TABLE "collab_metric_events" (
  "event_id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "doc_id" UUID NOT NULL,
  "event_type" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "collab_metric_events_pkey" PRIMARY KEY ("event_id")
);

CREATE UNIQUE INDEX "collab_operations_doc_id_server_version_key"
  ON "collab_operations"("doc_id", "server_version");
CREATE INDEX "collab_operations_doc_id_idx" ON "collab_operations"("doc_id");
CREATE INDEX "collab_operations_client_id_idx" ON "collab_operations"("client_id");
CREATE INDEX "collab_operations_created_at_idx" ON "collab_operations"("created_at");
CREATE INDEX "collab_snapshots_doc_id_version_idx" ON "collab_snapshots"("doc_id", "version");
CREATE INDEX "collab_metric_events_doc_id_event_type_idx"
  ON "collab_metric_events"("doc_id", "event_type");
CREATE INDEX "collab_metric_events_created_at_idx" ON "collab_metric_events"("created_at");

ALTER TABLE "collab_documents"
  ADD CONSTRAINT "collab_documents_doc_id_fkey"
  FOREIGN KEY ("doc_id") REFERENCES "workspace_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "collab_operations"
  ADD CONSTRAINT "collab_operations_doc_id_fkey"
  FOREIGN KEY ("doc_id") REFERENCES "collab_documents"("doc_id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "collab_operations"
  ADD CONSTRAINT "collab_operations_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "collab_snapshots"
  ADD CONSTRAINT "collab_snapshots_doc_id_fkey"
  FOREIGN KEY ("doc_id") REFERENCES "collab_documents"("doc_id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "collab_metric_events"
  ADD CONSTRAINT "collab_metric_events_doc_id_fkey"
  FOREIGN KEY ("doc_id") REFERENCES "collab_documents"("doc_id") ON DELETE CASCADE ON UPDATE CASCADE;
