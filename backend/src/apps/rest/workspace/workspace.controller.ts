import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import type { AuthenticatedRequest } from "../common/middleware/auth.js";
import {
  createDocumentDto,
  createFolderDto,
  moveWorkspaceItemDto,
  renameWorkspaceItemDto,
  shareWorkspaceItemDto,
  updateWorkspaceCollaboratorDto,
} from "../../../workspace/workspace.dto.js";
import {
  createDocument,
  createFolder,
  deleteWorkspaceItem,
  getWorkspaceItem,
  listItemCollaborators,
  listMoveTargets,
  listWorkspaceItems,
  moveWorkspaceItem,
  removeWorkspaceCollaborator,
  renameWorkspaceItem,
  shareWorkspaceItem,
  updateWorkspaceCollaborator,
} from "../../../workspace/workspace.service.js";

/** Lists root or folder-scoped workspace items for the authenticated user. */
export async function listItems(request: Request, response: Response) {
  const authRequest = request as AuthenticatedRequest;
  const parentId = typeof request.query.parentId === "string" ? request.query.parentId : null;
  const workspace = await listWorkspaceItems(parentId, authRequest.authUser);
  return response.status(StatusCodes.OK).json({ workspace });
}

/** Returns one workspace item. */
export async function getItem(request: Request, response: Response) {
  const authRequest = request as AuthenticatedRequest;
  const item = await getWorkspaceItem(getItemIdParam(request), authRequest.authUser);
  return response.status(StatusCodes.OK).json({ item });
}

/** Creates a folder item. */
export async function createFolderItem(request: Request, response: Response) {
  const authRequest = request as AuthenticatedRequest;
  const item = await createFolder(createFolderDto.parse(request.body), authRequest.authUser);
  return response.status(StatusCodes.CREATED).json({ item });
}

/** Creates a document item. */
export async function createDocumentItem(request: Request, response: Response) {
  const authRequest = request as AuthenticatedRequest;
  const item = await createDocument(createDocumentDto.parse(request.body), authRequest.authUser);
  return response.status(StatusCodes.CREATED).json({ item });
}

/** Renames a workspace item. */
export async function renameItem(request: Request, response: Response) {
  const authRequest = request as AuthenticatedRequest;
  const item = await renameWorkspaceItem(
    getItemIdParam(request),
    renameWorkspaceItemDto.parse(request.body),
    authRequest.authUser,
  );
  return response.status(StatusCodes.OK).json({ item });
}

/** Moves a workspace item. */
export async function moveItem(request: Request, response: Response) {
  const authRequest = request as AuthenticatedRequest;
  const item = await moveWorkspaceItem(
    getItemIdParam(request),
    moveWorkspaceItemDto.parse(request.body),
    authRequest.authUser,
  );
  return response.status(StatusCodes.OK).json({ item });
}

/** Deletes a workspace item. */
export async function deleteItem(request: Request, response: Response) {
  const authRequest = request as AuthenticatedRequest;
  await deleteWorkspaceItem(getItemIdParam(request), authRequest.authUser);
  return response.status(StatusCodes.NO_CONTENT).send();
}

/** Lists valid move targets for a workspace item. */
export async function getMoveTargets(request: Request, response: Response) {
  const authRequest = request as AuthenticatedRequest;
  const excludeItemId =
    typeof request.query.excludeItemId === "string" ? request.query.excludeItemId : "";
  const targets = await listMoveTargets(excludeItemId, authRequest.authUser);
  return response.status(StatusCodes.OK).json({ targets });
}

/** Shares a workspace item with another user. */
export async function shareItem(request: Request, response: Response) {
  const authRequest = request as AuthenticatedRequest;
  const item = await shareWorkspaceItem(
    getItemIdParam(request),
    shareWorkspaceItemDto.parse(request.body),
    authRequest.authUser,
  );
  return response.status(StatusCodes.OK).json({ item });
}

/** Lists direct collaborators for a workspace item. */
export async function getCollaborators(request: Request, response: Response) {
  const authRequest = request as AuthenticatedRequest;
  const collaborators = await listItemCollaborators(getItemIdParam(request), authRequest.authUser);
  return response.status(StatusCodes.OK).json({ collaborators });
}

/** Updates direct collaborator permission. */
export async function updateCollaborator(request: Request, response: Response) {
  const authRequest = request as AuthenticatedRequest;
  const item = await updateWorkspaceCollaborator(
    getItemIdParam(request),
    getUserIdParam(request),
    updateWorkspaceCollaboratorDto.parse(request.body),
    authRequest.authUser,
  );
  return response.status(StatusCodes.OK).json({ item });
}

/** Removes direct collaborator access. */
export async function removeCollaborator(request: Request, response: Response) {
  const authRequest = request as AuthenticatedRequest;
  const item = await removeWorkspaceCollaborator(
    getItemIdParam(request),
    getUserIdParam(request),
    authRequest.authUser,
  );
  return response.status(StatusCodes.OK).json({ item });
}

/**
 * Reads and validates an item id route parameter.
 *
 * @param request - Express request.
 * @returns Item id route parameter.
 */
function getItemIdParam(request: Request): string {
  const { itemId } = request.params;

  if (typeof itemId === "string" && itemId.length > 0) {
    return itemId;
  }

  return "";
}

/**
 * Reads and validates a user id route parameter.
 *
 * @param request - Express request.
 * @returns User id route parameter.
 */
function getUserIdParam(request: Request): string {
  const { userId } = request.params;

  if (typeof userId === "string" && userId.length > 0) {
    return userId;
  }

  return "";
}
