import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import {
  createDocumentSchema,
  inviteDocumentCollaboratorSchema,
  updateDocumentSchema,
} from './document.schemas.js';
import * as documentService from './document.service.js';
import { ApiError } from '../../utils/apiError.js';

function getDocumentIdParam(request: Request): string {
  const { documentId } = request.params;

  if (typeof documentId === 'string' && documentId.length > 0) {
    return documentId;
  }

  throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid document id.');
}

export async function listDocuments(request: Request, response: Response) {
  const workspaceId =
    typeof request.query.workspaceId === 'string' ? request.query.workspaceId : undefined;
  const documents = await documentService.listDocuments(request.authUser!.id, workspaceId);
  return response.status(StatusCodes.OK).json({ documents });
}

export async function getDocumentById(request: Request, response: Response) {
  const documentId = getDocumentIdParam(request);
  const document = await documentService.getDocumentById(documentId, request.authUser!.id);
  return response.status(StatusCodes.OK).json({ document });
}

export async function createDocument(request: Request, response: Response) {
  const input = createDocumentSchema.parse(request.body);
  const document = await documentService.createDocument(input, request.authUser!);
  return response.status(StatusCodes.CREATED).json({ document });
}

export async function updateDocument(request: Request, response: Response) {
  const documentId = getDocumentIdParam(request);
  const input = updateDocumentSchema.parse(request.body);
  const document = await documentService.updateDocument(documentId, input, request.authUser!);
  return response.status(StatusCodes.OK).json({ document });
}

export async function inviteDocumentCollaborator(request: Request, response: Response) {
  const documentId = getDocumentIdParam(request);
  const input = inviteDocumentCollaboratorSchema.parse(request.body);
  const document = await documentService.inviteDocumentCollaborator(
    documentId,
    input,
    request.authUser!,
  );
  return response.status(StatusCodes.OK).json({ document });
}

export async function deleteDocument(request: Request, response: Response) {
  const documentId = getDocumentIdParam(request);
  await documentService.deleteDocument(documentId, request.authUser!);
  return response.status(StatusCodes.NO_CONTENT).send();
}
