CREATE TABLE "DocumentCollaborationState" (
    "documentId" TEXT NOT NULL,
    "yjsState" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentCollaborationState_pkey" PRIMARY KEY ("documentId")
);

ALTER TABLE "DocumentCollaborationState"
ADD CONSTRAINT "DocumentCollaborationState_documentId_fkey"
FOREIGN KEY ("documentId") REFERENCES "Document"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
