import { StatusCodes } from "http-status-codes";
import { TiptapTransformer } from "@hocuspocus/transformer";
import * as Y from "yjs";
import { verifyAccessToken } from "../../shared/security/jwt.js";
import { findAuthUserById } from "../rest/auth/auth.repository.js";
import { toRestAuthUser } from "../rest/auth/auth.mapper.js";
import type { RestAuthUser } from "../rest/auth/auth.dto.js";
import { HttpError } from "../rest/common/errors/httpError.js";
import { getLegacyDocument } from "../../workspace/workspace.service.js";
import { findActiveWorkspaceItemById } from "../../workspace/workspace.repository.js";
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
  const user = toRestAuthUser(authUserRecord);
  const document = await getLegacyDocument(documentId, user);

  return {
    user,
    readOnly: !document.canEdit,
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

  const document = await findActiveWorkspaceItemById(documentId);
  if (!document || document.type !== "document" || !document.document) {
    throw new HttpError(StatusCodes.NOT_FOUND, "Document not found.");
  }

  const initialContent = document.document.content ?? emptyDocumentContent;

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
