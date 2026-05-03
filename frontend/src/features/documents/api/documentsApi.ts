import {
  ApiError,
  BACKEND_KIND,
  graphqlRequest,
  restRequest,
} from "@/shared/lib/api";
import type {
  CreateDocumentInput,
  Document,
  InviteDocumentCollaboratorInput,
  UpdateDocumentInput,
} from "../types/document.types";
import { normalizeDocument, normalizeDocuments } from "../types/document.types";

export type DocumentConflict = {
  expectedRevision: number;
  actualRevision: number;
  document: Document;
};

type DocumentConflictPayload = {
  conflict?: {
    expectedRevision: number;
    actualRevision: number;
  };
  document?: Document;
};

const collaboratorFields = `
  id
  name
  initials
  color
  role
`;

const documentFields = `
  id
  title
  content
  revision
  author
  createdAt
  updatedAt
  lastOpenedAt
  visibility
  workspaceId
  ownerId
  ownerName
  collaborators {
    ${collaboratorFields}
  }
  lastEditedById
  lastEditedByName
  lastEditedAt
`;

function createDocumentInput(input: CreateDocumentInput) {
  return {
    title: input.title,
    content: input.content ?? { type: "doc", content: [] },
    visibility: input.visibility ?? "private",
    workspaceId: input.workspaceId,
    collaborators: input.collaborators ?? [],
  };
}

export function getDocumentConflict(error: unknown): DocumentConflict | null {
  if (!(error instanceof ApiError) || error.status !== 409) {
    return null;
  }

  const payload = error.data as DocumentConflictPayload | null;

  if (!payload?.document || !payload.conflict) {
    return null;
  }

  return {
    expectedRevision: payload.conflict.expectedRevision,
    actualRevision: payload.conflict.actualRevision,
    document: normalizeDocument(payload.document),
  };
}

export function getConflictDocument(error: unknown): Document | null {
  return getDocumentConflict(error)?.document ?? null;
}

export async function listDocuments(
  token: string,
  workspaceId?: string | null,
): Promise<{ documents: Document[] }> {
  if (BACKEND_KIND === "graphql") {
    const response = await graphqlRequest<
      { documents: Document[] },
      { workspaceId?: string | null }
    >({
      query: `
        query Documents($workspaceId: ID) {
          documents(workspaceId: $workspaceId) {
            ${documentFields}
          }
        }
      `,
      variables: { workspaceId },
      token,
    });

    return { documents: normalizeDocuments(response.documents) };
  }

  const query = workspaceId ? `?workspaceId=${encodeURIComponent(workspaceId)}` : "";
  const response = await restRequest<{ documents: Document[] }>(`/documents${query}`, {
    method: "GET",
    token,
  });

  return { documents: normalizeDocuments(response.documents) };
}

export async function getDocument(
  documentId: string,
  token: string,
): Promise<{ document: Document }> {
  if (BACKEND_KIND === "graphql") {
    const response = await graphqlRequest<{ document: Document }, { documentId: string }>({
      query: `
        query Document($documentId: ID!) {
          document(documentId: $documentId) {
            ${documentFields}
          }
        }
      `,
      variables: { documentId },
      token,
    });

    return { document: normalizeDocument(response.document) };
  }

  const response = await restRequest<{ document: Document }>(`/documents/${documentId}`, {
    method: "GET",
    token,
  });

  return { document: normalizeDocument(response.document) };
}

export async function createDocumentRequest(
  input: CreateDocumentInput,
  token: string,
): Promise<{ document: Document }> {
  if (BACKEND_KIND === "graphql") {
    const response = await graphqlRequest<
      { createDocument: Document },
      { input: ReturnType<typeof createDocumentInput> }
    >({
      query: `
        mutation CreateDocument($input: CreateDocumentInput!) {
          createDocument(input: $input) {
            ${documentFields}
          }
        }
      `,
      variables: { input: createDocumentInput(input) },
      token,
    });

    return { document: normalizeDocument(response.createDocument) };
  }

  const response = await restRequest<{ document: Document }>("/documents", {
    method: "POST",
    token,
    body: createDocumentInput(input),
  });

  return { document: normalizeDocument(response.document) };
}

export async function updateDocumentRequest(
  documentId: string,
  input: UpdateDocumentInput,
  token: string,
): Promise<{ document: Document }> {
  if (BACKEND_KIND === "graphql") {
    const response = await graphqlRequest<
      { updateDocument: Document },
      { documentId: string; input: UpdateDocumentInput }
    >({
      query: `
        mutation UpdateDocument($documentId: ID!, $input: UpdateDocumentInput!) {
          updateDocument(documentId: $documentId, input: $input) {
            ${documentFields}
          }
        }
      `,
      variables: { documentId, input },
      token,
    });

    return { document: normalizeDocument(response.updateDocument) };
  }

  const response = await restRequest<{ document: Document }>(`/documents/${documentId}`, {
    method: "PATCH",
    token,
    body: input,
  });

  return { document: normalizeDocument(response.document) };
}

export async function deleteDocumentRequest(
  documentId: string,
  token: string,
): Promise<void> {
  if (BACKEND_KIND === "graphql") {
    await graphqlRequest<
      { deleteDocument: { success: boolean } },
      { documentId: string }
    >({
      query: `
        mutation DeleteDocument($documentId: ID!) {
          deleteDocument(documentId: $documentId) {
            success
          }
        }
      `,
      variables: { documentId },
      token,
    });
    return;
  }

  await restRequest(`/documents/${documentId}`, {
    method: "DELETE",
    token,
  });
}

export async function inviteDocumentCollaboratorRequest(
  documentId: string,
  input: InviteDocumentCollaboratorInput,
  token: string,
): Promise<{ document: Document }> {
  if (BACKEND_KIND === "graphql") {
    const response = await graphqlRequest<
      { inviteDocumentCollaborator: Document },
      { documentId: string; input: InviteDocumentCollaboratorInput }
    >({
      query: `
        mutation InviteDocumentCollaborator(
          $documentId: ID!
          $input: InviteDocumentCollaboratorInput!
        ) {
          inviteDocumentCollaborator(documentId: $documentId, input: $input) {
            ${documentFields}
          }
        }
      `,
      variables: { documentId, input },
      token,
    });

    return { document: normalizeDocument(response.inviteDocumentCollaborator) };
  }

  const response = await restRequest<{ document: Document }>(
    `/documents/${documentId}/collaborators`,
    {
      method: "POST",
      token,
      body: input,
    },
  );

  return { document: normalizeDocument(response.document) };
}
