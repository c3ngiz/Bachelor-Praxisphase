import { StatusCodes } from "http-status-codes";
import { TiptapTransformer } from "@hocuspocus/transformer";
import * as Y from "yjs";
import { verifyAccessToken } from "../../shared/security/jwt.js";
import { findAuthUserById } from "../rest/auth/auth.repository.js";
import { toRestAuthUser } from "../rest/auth/auth.mapper.js";
import type { RestAuthUser } from "../rest/auth/auth.dto.js";
import { HttpError } from "../rest/common/errors/httpError.js";
import { findRestDocumentById } from "../rest/documents/document.repository.js";
import { toRestDocument } from "../rest/documents/document.mapper.js";
import {
  canRestAccessDocument,
  canRestEditDocument,
} from "../rest/documents/document.permissions.js";
import { collaborationEditorExtensions } from "./editorExtensions.js";
import {
  findCollaborationState,
  updateDocumentCollaborationSnapshot,
  upsertCollaborationState,
} from "./collaboration.repository.js";

export type CollaborationContext = {
  user: RestAuthUser;
  readOnly: boolean;
};

const emptyDocumentContent = { type: "doc", content: [] };

function documentNameToId(documentName: string): string {
  return documentName.replace(/^document:/, "");
}

export async function authenticateCollaborationConnection(input: {
  token: string;
  documentName: string;
}): Promise<CollaborationContext> {
  const payload = verifyAccessToken(input.token);
  const authUserRecord = await findAuthUserById(payload.sub);

  if (!authUserRecord) {
    throw new HttpError(StatusCodes.UNAUTHORIZED, "User for this token no longer exists.");
  }

  const documentId = documentNameToId(input.documentName);
  const document = await findRestDocumentById(documentId);

  if (!document) {
    throw new HttpError(StatusCodes.NOT_FOUND, "Document not found.");
  }

  const user = toRestAuthUser(authUserRecord);
  const canAccess = await canRestAccessDocument(document, user.id);

  if (!canAccess) {
    throw new HttpError(StatusCodes.FORBIDDEN, "You do not have access to this document.");
  }

  const canEdit = await canRestEditDocument(document, user);

  return {
    user,
    readOnly: !canEdit,
  };
}

export async function loadCollaborationDocument(documentName: string): Promise<Y.Doc> {
  const documentId = documentNameToId(documentName);
  const storedState = await findCollaborationState(documentId);

  if (storedState) {
    const ydoc = new Y.Doc();
    Y.applyUpdate(ydoc, new Uint8Array(storedState.yjsState));
    return ydoc;
  }

  const document = await findRestDocumentById(documentId);
  if (!document) {
    throw new HttpError(StatusCodes.NOT_FOUND, "Document not found.");
  }

  const initialContent = toRestDocument(document).content ?? emptyDocumentContent;

  return TiptapTransformer.toYdoc(
    initialContent,
    "default",
    collaborationEditorExtensions,
  );
}

export async function storeCollaborationDocument(input: {
  documentName: string;
  document: Y.Doc;
  context?: CollaborationContext;
}) {
  const documentId = documentNameToId(input.documentName);
  const yjsState = Y.encodeStateAsUpdate(input.document);
  const snapshot = TiptapTransformer.fromYdoc(input.document, "default");

  await upsertCollaborationState(documentId, yjsState);

  if (input.context) {
    await updateDocumentCollaborationSnapshot({
      documentId,
      content: snapshot,
      editorId: input.context.user.id,
      editorName: input.context.user.name,
    });
  }
}
