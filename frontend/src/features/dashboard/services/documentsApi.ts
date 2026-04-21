import { apiRequest } from "@/shared/lib/api";
import type {
  CreateDocumentInput,
  Document,
  UpdateDocumentInput,
} from "../types/document.types";

export async function listDocuments(
  token: string,
): Promise<{ documents: Document[] }> {
  return apiRequest<{ documents: Document[] }>("/documents", {
    method: "GET",
    token,
  });
}

export async function getDocument(
  documentId: string,
  token: string,
): Promise<{ document: Document }> {
  return apiRequest<{ document: Document }>(`/documents/${documentId}`, {
    method: "GET",
    token,
  });
}

export async function createDocumentRequest(
  input: CreateDocumentInput,
  token: string,
): Promise<{ document: Document }> {
  return apiRequest<{ document: Document }>("/documents", {
    method: "POST",
    token,
    body: {
      title: input.title,
      content: input.content ?? { type: "doc", content: [] },
      visibility: input.visibility ?? "private",
      collaborators: input.collaborators ?? [],
    },
  });
}

export async function updateDocumentRequest(
  documentId: string,
  input: UpdateDocumentInput,
  token: string,
): Promise<{ document: Document }> {
  return apiRequest<{ document: Document }>(`/documents/${documentId}`, {
    method: "PATCH",
    token,
    body: input,
  });
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
