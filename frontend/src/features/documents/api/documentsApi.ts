import { apiRequest } from "@/shared/lib/api";
import { ApiError } from "@/shared/lib/api";
import type {
  CreateDocumentInput,
  Document,
  InviteDocumentCollaboratorInput,
  UpdateDocumentInput,
} from "../types/document.types";
import { normalizeDocument, normalizeDocuments } from "../types/document.types";

type DocumentConflictPayload = {
  conflict?: {
    expectedRevision: number;
    actualRevision: number;
  };
  document?: Document;
};

export function getConflictDocument(error: unknown): Document | null {
  if (!(error instanceof ApiError) || error.status !== 409) {
    return null;
  }

  const payload = error.data as DocumentConflictPayload | null;

  if (!payload?.document) {
    return null;
  }

  return normalizeDocument(payload.document);
}

export async function listDocuments(
  token: string,
  workspaceId?: string | null,
): Promise<{ documents: Document[] }> {
  const query = workspaceId ? `?workspaceId=${encodeURIComponent(workspaceId)}` : "";
  const response = await apiRequest<{ documents: Document[] }>(`/documents${query}`, {
    method: "GET",
    token,
  });

  return {
    documents: normalizeDocuments(response.documents),
  };
}

export async function getDocument(
  documentId: string,
  token: string,
): Promise<{ document: Document }> {
  const response = await apiRequest<{ document: Document }>(
    `/documents/${documentId}`,
    {
      method: "GET",
      token,
    },
  );

  return {
    document: normalizeDocument(response.document),
  };
}

export async function createDocumentRequest(
  input: CreateDocumentInput,
  token: string,
): Promise<{ document: Document }> {
  const response = await apiRequest<{ document: Document }>("/documents", {
    method: "POST",
    token,
    body: {
      title: input.title,
      content: input.content ?? { type: "doc", content: [] },
      visibility: input.visibility ?? "private",
      workspaceId: input.workspaceId,
      collaborators: input.collaborators ?? [],
    },
  });

  return {
    document: normalizeDocument(response.document),
  };
}

export async function updateDocumentRequest(
  documentId: string,
  input: UpdateDocumentInput,
  token: string,
): Promise<{ document: Document }> {
  const response = await apiRequest<{ document: Document }>(
    `/documents/${documentId}`,
    {
      method: "PATCH",
      token,
      body: input,
    },
  );

  return {
    document: normalizeDocument(response.document),
  };
}

export async function deleteDocumentRequest(
  documentId: string,
  token: string,
): Promise<void> {
  await apiRequest(`/documents/${documentId}`, {
    method: "DELETE",
    token,
  });
}

export async function inviteDocumentCollaboratorRequest(
  documentId: string,
  input: InviteDocumentCollaboratorInput,
  token: string,
): Promise<{ document: Document }> {
  const response = await apiRequest<{ document: Document }>(
    `/documents/${documentId}/collaborators`,
    {
      method: "POST",
      token,
      body: input,
    },
  );

  return {
    document: normalizeDocument(response.document),
  };
}
