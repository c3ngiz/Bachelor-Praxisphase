import { apiRequest } from "@/shared/lib/api";
import type {
  CreateDocumentInput,
  Document,
  UpdateDocumentInput,
} from "../types/document.types";
import { normalizeDocument, normalizeDocuments } from "../types/document.types";

export async function listDocuments(
  token: string,
): Promise<{ documents: Document[] }> {
  const response = await apiRequest<{ documents: Document[] }>("/documents", {
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
