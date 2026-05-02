import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import type { AuthenticatedRequest } from "../common/middleware/auth.js";
import { HttpError } from "../common/errors/httpError.js";
import {
  restCreateDocumentDto,
  restInviteDocumentCollaboratorDto,
  restUpdateDocumentDto,
} from "./document.dto.js";
import {
  createRestDocument,
  deleteRestDocument,
  getRestDocumentById,
  inviteRestDocumentCollaborator,
  listRestDocuments,
  updateRestDocument,
} from "./document.service.js";

function getDocumentIdParam(request: Request): string {
  const { documentId } = request.params;

  if (typeof documentId === "string" && documentId.length > 0) {
    return documentId;
  }

  throw new HttpError(StatusCodes.BAD_REQUEST, "Invalid document id.");
}

/** Lists REST documents visible to the authenticated user. */
export async function listDocuments(request: Request, response: Response) {
  const authRequest = request as AuthenticatedRequest;
  const workspaceId =
    typeof request.query.workspaceId === "string" ? request.query.workspaceId : undefined;
  const documents = await listRestDocuments(authRequest.authUser.id, workspaceId);
  return response.status(StatusCodes.OK).json({ documents });
}

/** Gets a single REST document. */
export async function getDocumentById(request: Request, response: Response) {
  const authRequest = request as AuthenticatedRequest;
  const document = await getRestDocumentById(getDocumentIdParam(request), authRequest.authUser.id);
  return response.status(StatusCodes.OK).json({ document });
}

/** Creates a REST document. */
export async function createDocument(request: Request, response: Response) {
  const authRequest = request as AuthenticatedRequest;
  const document = await createRestDocument(
    restCreateDocumentDto.parse(request.body),
    authRequest.authUser,
  );
  return response.status(StatusCodes.CREATED).json({ document });
}

/** Updates a REST document. */
export async function updateDocument(request: Request, response: Response) {
  const authRequest = request as AuthenticatedRequest;
  const document = await updateRestDocument(
    getDocumentIdParam(request),
    restUpdateDocumentDto.parse(request.body),
    authRequest.authUser,
  );
  return response.status(StatusCodes.OK).json({ document });
}

/** Invites a REST document collaborator. */
export async function inviteDocumentCollaborator(request: Request, response: Response) {
  const authRequest = request as AuthenticatedRequest;
  const document = await inviteRestDocumentCollaborator(
    getDocumentIdParam(request),
    restInviteDocumentCollaboratorDto.parse(request.body),
    authRequest.authUser,
  );
  return response.status(StatusCodes.OK).json({ document });
}

/** Deletes a REST document. */
export async function deleteDocument(request: Request, response: Response) {
  const authRequest = request as AuthenticatedRequest;
  await deleteRestDocument(getDocumentIdParam(request), authRequest.authUser);
  return response.status(StatusCodes.NO_CONTENT).send();
}
