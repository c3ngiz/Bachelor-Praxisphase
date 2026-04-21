import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { createDocumentSchema, updateDocumentSchema } from "./document.schemas.js";
import * as documentService from "./document.service.js";

export async function listDocuments(request: Request, response: Response) {
  const documents = await documentService.listDocuments(request.authUser!.id);
  return response.status(StatusCodes.OK).json({ documents });
}

export async function getDocumentById(request: Request, response: Response) {
  const document = await documentService.getDocumentById(request.params.documentId, request.authUser!.id);
  return response.status(StatusCodes.OK).json({ document });
}

export async function createDocument(request: Request, response: Response) {
  const input = createDocumentSchema.parse(request.body);
  const document = await documentService.createDocument(input, request.authUser!);
  return response.status(StatusCodes.CREATED).json({ document });
}

export async function updateDocument(request: Request, response: Response) {
  const input = updateDocumentSchema.parse(request.body);
  const document = await documentService.updateDocument(request.params.documentId, input, request.authUser!);
  return response.status(StatusCodes.OK).json({ document });
}

export async function deleteDocument(request: Request, response: Response) {
  await documentService.deleteDocument(request.params.documentId, request.authUser!);
  return response.status(StatusCodes.NO_CONTENT).send();
}
