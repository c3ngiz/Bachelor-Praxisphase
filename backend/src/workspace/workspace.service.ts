import { Prisma } from "@prisma/client";
import { StatusCodes } from "http-status-codes";
import { DomainError } from "../shared/errors/domainError.js";
import {
  type CreateDocumentInput,
  type CreateFolderInput,
  type MoveWorkspaceItemInput,
  type RenameWorkspaceItemInput,
  type ShareWorkspaceItemInput,
  type UpdateDocumentContentInput,
  type UpdateWorkspaceCollaboratorInput,
} from "./workspace.dto.js";
import {
  buildWorkspaceBreadcrumbs,
  toLegacyDocumentResponse,
  toMoveTargetResponse,
  toWorkspaceCollaboratorResponse,
  toWorkspaceItemResponse,
} from "./workspace.mapper.js";
import {
  createDocumentRecord,
  createFolderRecord,
  deleteWorkspaceCollaboratorRecord,
  findActiveDocumentItems,
  findActiveDuplicateName,
  findActiveFolderItems,
  findActiveWorkspaceChildren,
  findActiveWorkspaceItemById,
  findWorkspaceUserByEmail,
  moveWorkspaceItemRecord,
  reloadWorkspaceItem,
  renameWorkspaceItemRecord,
  softDeleteWorkspaceItems,
  updateDocumentRecordByRevision,
  updateWorkspaceCollaboratorRecord,
  upsertWorkspaceCollaborator,
} from "./workspace.repository.js";
import {
  getActiveDescendants,
  getEffectivePermission,
  isDescendantFolder,
  requireItemOwner,
  requireReadableItem,
  requireWritableItem,
} from "./workspace.permissions.js";
import type {
  MoveTargetResponse,
  WorkspaceAuthUser,
  WorkspaceCollaboratorResponse,
  WorkspaceItemResponse,
  WorkspaceItemsResponse,
  WorkspaceItemWithRelations,
  WorkspaceLegacyDocumentResponse,
} from "./workspace.types.js";

const defaultDocumentContent = { type: "doc", content: [] };

/**
 * Lists root or folder-scoped workspace items visible to the current user.
 *
 * @param parentId - Parent folder id, or null for root.
 * @param authUser - Current authenticated user.
 * @returns Folder contents and breadcrumbs.
 */
export async function listWorkspaceItems(
  parentId: string | null,
  authUser: WorkspaceAuthUser,
): Promise<WorkspaceItemsResponse> {
  const parent = parentId ? await getFolderOrThrow(parentId) : null;

  if (parent) {
    await requireReadableItem(parent, authUser.id);
  }

  const children = await findActiveWorkspaceChildren(parentId, authUser.id);
  const visibleItems: WorkspaceItemResponse[] = [];

  for (const item of children) {
    if (await getEffectivePermission(item, authUser.id)) {
      visibleItems.push(await toWorkspaceItemResponse(item, authUser.id));
    }
  }

  return {
    breadcrumbs: await buildWorkspaceBreadcrumbs(parent),
    folderId: parentId,
    items: visibleItems,
  };
}

/**
 * Returns one workspace item visible to the current user.
 *
 * @param itemId - Workspace item id.
 * @param authUser - Current authenticated user.
 * @returns Workspace item response.
 */
export async function getWorkspaceItem(
  itemId: string,
  authUser: WorkspaceAuthUser,
): Promise<WorkspaceItemResponse> {
  const item = await getItemOrThrow(itemId);
  await requireReadableItem(item, authUser.id);
  return toWorkspaceItemResponse(item, authUser.id);
}

/**
 * Creates a folder at root or inside a writable folder.
 *
 * @param input - Folder creation input.
 * @param authUser - Current authenticated user.
 * @returns Created folder.
 */
export async function createFolder(
  input: CreateFolderInput,
  authUser: WorkspaceAuthUser,
): Promise<WorkspaceItemResponse> {
  const parentId = input.parentId ?? null;
  await validateParentForCreate(parentId, authUser.id);
  await ensureNameAvailable({
    name: input.name,
    ownerId: authUser.id,
    parentId,
  });

  const item = await createFolderRecord({
    name: input.name,
    ownerId: authUser.id,
    parentId,
  });

  return toWorkspaceItemResponse(item, authUser.id);
}

/**
 * Creates a document metadata item with initial JSON content.
 *
 * @param input - Document creation input.
 * @param authUser - Current authenticated user.
 * @returns Created document workspace item.
 */
export async function createDocument(
  input: CreateDocumentInput,
  authUser: WorkspaceAuthUser,
): Promise<WorkspaceItemResponse> {
  const parentId = input.parentId ?? null;
  const name = input.name ?? input.title ?? "Untitled document";
  await validateParentForCreate(parentId, authUser.id);
  await ensureNameAvailable({ name, ownerId: authUser.id, parentId });

  const item = await createDocumentRecord({
    content: toPrismaJson(input.content ?? defaultDocumentContent),
    editorName: authUser.name,
    name,
    ownerId: authUser.id,
    parentId,
  });

  return toWorkspaceItemResponse(item, authUser.id);
}

/**
 * Renames a writable workspace item.
 *
 * @param itemId - Item id.
 * @param input - Rename input.
 * @param authUser - Current authenticated user.
 * @returns Updated item.
 */
export async function renameWorkspaceItem(
  itemId: string,
  input: RenameWorkspaceItemInput,
  authUser: WorkspaceAuthUser,
): Promise<WorkspaceItemResponse> {
  const item = await getItemOrThrow(itemId);
  await requireWritableItem(item, authUser.id);
  await ensureNameAvailable({
    excludeItemId: item.id,
    name: input.name,
    ownerId: item.ownerId,
    parentId: item.parentId,
  });

  const updatedItem = await renameWorkspaceItemRecord(item.id, input.name);
  return toWorkspaceItemResponse(updatedItem, authUser.id);
}

/**
 * Moves a writable item into a writable folder or back to the owner's root.
 *
 * @param itemId - Item id.
 * @param input - Move input.
 * @param authUser - Current authenticated user.
 * @returns Updated item.
 */
export async function moveWorkspaceItem(
  itemId: string,
  input: MoveWorkspaceItemInput,
  authUser: WorkspaceAuthUser,
): Promise<WorkspaceItemResponse> {
  const item = await getItemOrThrow(itemId);
  const targetFolderId = input.targetFolderId ?? null;
  await requireWritableItem(item, authUser.id);

  if (targetFolderId === null && item.ownerId !== authUser.id) {
    throw new DomainError(
      StatusCodes.FORBIDDEN,
      "FORBIDDEN",
      "Only the item owner can move this item to their root workspace.",
    );
  }

  if (targetFolderId) {
    const targetFolder = await getFolderOrThrow(targetFolderId);
    await requireWritableItem(targetFolder, authUser.id);

    if (item.type === "folder") {
      if (targetFolderId === item.id || (await isDescendantFolder(item.id, targetFolderId))) {
        throw new DomainError(
          StatusCodes.BAD_REQUEST,
          "BAD_REQUEST",
          "A folder cannot be moved into itself or one of its descendants.",
        );
      }
    }
  }

  await ensureNameAvailable({
    excludeItemId: item.id,
    name: item.name,
    ownerId: item.ownerId,
    parentId: targetFolderId,
  });

  const updatedItem = await moveWorkspaceItemRecord(item.id, targetFolderId);
  return toWorkspaceItemResponse(updatedItem, authUser.id);
}

/**
 * Soft-deletes an item and folder descendants owned by the current user.
 *
 * @param itemId - Item id.
 * @param authUser - Current authenticated user.
 */
export async function deleteWorkspaceItem(
  itemId: string,
  authUser: WorkspaceAuthUser,
): Promise<void> {
  const item = await getItemOrThrow(itemId);
  requireItemOwner(item, authUser.id);
  const descendants = item.type === "folder" ? await getActiveDescendants(item.id) : [];
  const foreignDescendant = descendants.find((descendant) => descendant.ownerId !== authUser.id);

  if (foreignDescendant) {
    throw new DomainError(
      StatusCodes.FORBIDDEN,
      "FORBIDDEN",
      "Folders can only be deleted when every descendant is owned by you.",
    );
  }

  await softDeleteWorkspaceItems([item.id, ...descendants.map((descendant) => descendant.id)]);
}

/**
 * Lists folder destinations for a move operation.
 *
 * @param itemId - Item being moved.
 * @param authUser - Current authenticated user.
 * @returns Move targets.
 */
export async function listMoveTargets(
  itemId: string,
  authUser: WorkspaceAuthUser,
): Promise<MoveTargetResponse[]> {
  const item = await getItemOrThrow(itemId);
  await requireWritableItem(item, authUser.id);
  const folders = await findActiveFolderItems();
  const targets: MoveTargetResponse[] = [
    {
      canMoveHere: item.ownerId === authUser.id,
      id: null,
      name: "Workspace",
      path: "Workspace",
    },
  ];

  for (const folder of folders) {
    const canWrite = (await getEffectivePermission(folder, authUser.id)) === "write" ||
      (await getEffectivePermission(folder, authUser.id)) === "owner";
    const wouldCycle =
      item.type === "folder" &&
      (folder.id === item.id || (await isDescendantFolder(item.id, folder.id)));

    if (canWrite && !wouldCycle) {
      targets.push(await toMoveTargetResponse(folder, true));
    }
  }

  return targets;
}

/**
 * Shares an item with another registered user.
 *
 * @param itemId - Item id.
 * @param input - Share input.
 * @param authUser - Current authenticated user.
 * @returns Updated item.
 */
export async function shareWorkspaceItem(
  itemId: string,
  input: ShareWorkspaceItemInput,
  authUser: WorkspaceAuthUser,
): Promise<WorkspaceItemResponse> {
  const item = await getItemOrThrow(itemId);
  requireItemOwner(item, authUser.id);
  const invitedUser = await findWorkspaceUserByEmail(input.email);

  if (!invitedUser) {
    throw new DomainError(
      StatusCodes.NOT_FOUND,
      "NOT_FOUND",
      "No registered user exists for this email.",
    );
  }

  if (invitedUser.id === item.ownerId) {
    throw new DomainError(StatusCodes.BAD_REQUEST, "BAD_REQUEST", "The owner already has access.");
  }

  await upsertWorkspaceCollaborator({
    itemId: item.id,
    permission: input.permission,
    userId: invitedUser.id,
  });

  return reloadMappedItem(item.id, authUser.id);
}

/**
 * Returns direct collaborators for an accessible item.
 *
 * @param itemId - Item id.
 * @param authUser - Current authenticated user.
 * @returns Direct collaborator responses including owner.
 */
export async function listItemCollaborators(
  itemId: string,
  authUser: WorkspaceAuthUser,
): Promise<WorkspaceCollaboratorResponse[]> {
  const item = await getItemOrThrow(itemId);
  await requireReadableItem(item, authUser.id);
  return (await toWorkspaceItemResponse(item, authUser.id)).collaborators;
}

/**
 * Updates direct collaborator permission.
 *
 * @param itemId - Item id.
 * @param collaboratorUserId - Collaborator user id.
 * @param input - Permission update input.
 * @param authUser - Current authenticated user.
 * @returns Updated item.
 */
export async function updateWorkspaceCollaborator(
  itemId: string,
  collaboratorUserId: string,
  input: UpdateWorkspaceCollaboratorInput,
  authUser: WorkspaceAuthUser,
): Promise<WorkspaceItemResponse> {
  const item = await getItemOrThrow(itemId);
  requireItemOwner(item, authUser.id);

  if (collaboratorUserId === item.ownerId) {
    throw new DomainError(StatusCodes.BAD_REQUEST, "BAD_REQUEST", "Owner access cannot be changed.");
  }

  await updateWorkspaceCollaboratorRecord({
    itemId: item.id,
    permission: input.permission,
    userId: collaboratorUserId,
  });

  return reloadMappedItem(item.id, authUser.id);
}

/**
 * Removes a direct collaborator.
 *
 * @param itemId - Item id.
 * @param collaboratorUserId - Collaborator user id.
 * @param authUser - Current authenticated user.
 * @returns Updated item.
 */
export async function removeWorkspaceCollaborator(
  itemId: string,
  collaboratorUserId: string,
  authUser: WorkspaceAuthUser,
): Promise<WorkspaceItemResponse> {
  const item = await getItemOrThrow(itemId);
  requireItemOwner(item, authUser.id);

  if (collaboratorUserId === item.ownerId) {
    throw new DomainError(StatusCodes.BAD_REQUEST, "BAD_REQUEST", "Owner access cannot be removed.");
  }

  await deleteWorkspaceCollaboratorRecord(item.id, collaboratorUserId);
  return reloadMappedItem(item.id, authUser.id);
}

/**
 * Lists all document items visible to the current user for legacy document APIs.
 *
 * @param authUser - Current authenticated user.
 * @returns Legacy document responses.
 */
export async function listLegacyDocuments(
  authUser: WorkspaceAuthUser,
): Promise<WorkspaceLegacyDocumentResponse[]> {
  const items = await findActiveDocumentItems();
  const documents: WorkspaceLegacyDocumentResponse[] = [];

  for (const item of items) {
    const permission = await getEffectivePermission(item, authUser.id);

    if (permission && item.document) {
      documents.push(toLegacyDocumentResponse(item, permission));
    }
  }

  return documents;
}

/**
 * Gets one document through the legacy document API.
 *
 * @param documentId - Document item id.
 * @param authUser - Current authenticated user.
 * @returns Legacy document response.
 */
export async function getLegacyDocument(
  documentId: string,
  authUser: WorkspaceAuthUser,
): Promise<WorkspaceLegacyDocumentResponse> {
  const item = await getItemOrThrow(documentId);

  if (item.type !== "document" || !item.document) {
    throw new DomainError(StatusCodes.NOT_FOUND, "NOT_FOUND", "Document not found.");
  }

  const permission = await requireReadableItem(item, authUser.id);
  return toLegacyDocumentResponse(item, permission);
}

/**
 * Updates document content through the legacy document API.
 *
 * @param documentId - Document item id.
 * @param input - Optimistic document update input.
 * @param authUser - Current authenticated user.
 * @returns Updated legacy document response.
 */
export async function updateLegacyDocument(
  documentId: string,
  input: UpdateDocumentContentInput,
  authUser: WorkspaceAuthUser,
): Promise<WorkspaceLegacyDocumentResponse> {
  const item = await getItemOrThrow(documentId);

  if (item.type !== "document" || !item.document) {
    throw new DomainError(StatusCodes.NOT_FOUND, "NOT_FOUND", "Document not found.");
  }

  await requireWritableItem(item, authUser.id);
  const updateResult = await updateDocumentRecordByRevision({
    data: {
      content:
        input.content === undefined
          ? undefined
          : input.content === null
            ? Prisma.JsonNull
            : toPrismaJson(input.content),
      lastEditedAt: new Date(),
      lastEditedById: authUser.id,
      lastEditedByName: authUser.name,
      lastOpenedAt:
        input.lastOpenedAt === undefined
          ? undefined
          : input.lastOpenedAt === null
            ? null
            : new Date(input.lastOpenedAt),
      revision: { increment: 1 },
    },
    documentId: item.id,
    expectedRevision: input.expectedRevision,
    itemName: input.title,
  });

  const currentItem = await getItemOrThrow(documentId);

  if (updateResult.count === 0) {
    throw new DomainError(StatusCodes.CONFLICT, "CONFLICT", "Document revision conflict.", {
      conflict: {
        actualRevision: currentItem.document?.revision ?? item.document.revision,
        expectedRevision: input.expectedRevision,
      },
      document: toLegacyDocumentResponse(currentItem, await requireReadableItem(currentItem, authUser.id)),
    });
  }

  return getLegacyDocument(documentId, authUser);
}

/**
 * Shares a document through the legacy document API.
 *
 * @param documentId - Document item id.
 * @param email - Collaborator email.
 * @param role - Legacy viewer/editor role.
 * @param authUser - Current authenticated user.
 * @returns Updated legacy document response.
 */
export async function inviteLegacyDocumentCollaborator(
  documentId: string,
  email: string,
  role: "viewer" | "editor",
  authUser: WorkspaceAuthUser,
): Promise<WorkspaceLegacyDocumentResponse> {
  await shareWorkspaceItem(
    documentId,
    {
      email: email.toLowerCase(),
      permission: role === "editor" ? "write" : "read",
    },
    authUser,
  );
  return getLegacyDocument(documentId, authUser);
}

/**
 * Deletes a document through the legacy document API.
 *
 * @param documentId - Document item id.
 * @param authUser - Current authenticated user.
 */
export async function deleteLegacyDocument(
  documentId: string,
  authUser: WorkspaceAuthUser,
): Promise<void> {
  await deleteWorkspaceItem(documentId, authUser);
}

/**
 * Reloads and maps an item after a mutation.
 *
 * @param itemId - Item id.
 * @param userId - Current user id.
 * @returns Workspace item response.
 */
async function reloadMappedItem(itemId: string, userId: string): Promise<WorkspaceItemResponse> {
  const item = await reloadWorkspaceItem(itemId);

  if (!item) {
    throw new DomainError(StatusCodes.NOT_FOUND, "NOT_FOUND", "Item not found.");
  }

  return toWorkspaceItemResponse(item, userId);
}

/**
 * Finds an active item or throws a not-found domain error.
 *
 * @param itemId - Item id.
 * @returns Active workspace item.
 */
async function getItemOrThrow(itemId: string): Promise<WorkspaceItemWithRelations> {
  const item = await findActiveWorkspaceItemById(itemId);

  if (!item) {
    throw new DomainError(StatusCodes.NOT_FOUND, "NOT_FOUND", "Item not found.");
  }

  return item;
}

/**
 * Finds an active folder or throws an appropriate domain error.
 *
 * @param folderId - Folder item id.
 * @returns Active folder item.
 */
async function getFolderOrThrow(folderId: string): Promise<WorkspaceItemWithRelations> {
  const folder = await getItemOrThrow(folderId);

  if (folder.type !== "folder") {
    throw new DomainError(StatusCodes.BAD_REQUEST, "BAD_REQUEST", "Parent must be a folder.");
  }

  return folder;
}

/**
 * Validates parent folder access for create operations.
 *
 * @param parentId - Parent folder id, or null for root.
 * @param userId - Current user id.
 */
async function validateParentForCreate(parentId: string | null, userId: string): Promise<void> {
  if (!parentId) {
    return;
  }

  const parent = await getFolderOrThrow(parentId);
  await requireWritableItem(parent, userId);
}

/**
 * Enforces active sibling name uniqueness.
 *
 * Root-level names are scoped to the owner; names inside folders are scoped to
 * the folder regardless of child owner.
 *
 * @param input - Name conflict lookup input.
 */
async function ensureNameAvailable(input: {
  name: string;
  ownerId: string;
  parentId: string | null;
  excludeItemId?: string;
}): Promise<void> {
  const duplicate = await findActiveDuplicateName(input);

  if (duplicate) {
    throw new DomainError(
      StatusCodes.CONFLICT,
      "CONFLICT",
      "An item with this name already exists in this folder.",
    );
  }
}

/**
 * Converts unknown document JSON into a Prisma JSON value.
 *
 * @param value - User-supplied JSON value.
 * @returns Prisma JSON input.
 */
function toPrismaJson(value: unknown): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  if (value === null) {
    return Prisma.JsonNull;
  }

  return toNestedPrismaJson(value);
}

/**
 * Converts nested JSON values after the top-level null case has been handled.
 *
 * @param value - User-supplied JSON value.
 * @returns Prisma JSON input that may include nested null values.
 */
function toNestedPrismaJson(value: unknown): Prisma.InputJsonValue {
  if (value === null) {
    return null as unknown as Prisma.InputJsonValue;
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => toNestedPrismaJson(item)) as Prisma.InputJsonArray;
  }

  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        item === undefined ? null : toNestedPrismaJson(item),
      ]),
    ) as Prisma.InputJsonObject;
  }

  throw new DomainError(StatusCodes.BAD_REQUEST, "BAD_REQUEST", "Document content must be valid JSON.");
}
