import { Prisma, type PermissionLevel, type WorkspaceItemType } from "@prisma/client";
import { prisma } from "../shared/database/prisma.js";

const userSummarySelect = {
  id: true,
  email: true,
  name: true,
  initials: true,
  avatarColor: true,
} satisfies Prisma.UserSelect;

/** Relation graph required to map workspace items for API responses. */
export const workspaceItemInclude = {
  owner: { select: userSummarySelect },
  document: true,
  collaborators: {
    include: {
      user: { select: userSummarySelect },
    },
    orderBy: { createdAt: "asc" },
  },
} satisfies Prisma.WorkspaceItemInclude;

/** Finds a user by email for sharing invitations. */
export function findWorkspaceUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: userSummarySelect,
  });
}

/** Finds an active workspace item by id. */
export function findActiveWorkspaceItemById(itemId: string) {
  return prisma.workspaceItem.findFirst({
    where: { id: itemId, deletedAt: null },
    include: workspaceItemInclude,
  });
}

/** Finds active direct children under a parent folder or root. */
export function findActiveWorkspaceChildren(parentId: string | null, userId: string) {
  return prisma.workspaceItem.findMany({
    where:
      parentId === null
        ? {
            deletedAt: null,
            parentId: null,
            OR: [{ ownerId: userId }, { collaborators: { some: { userId } } }],
          }
        : { deletedAt: null, parentId },
    include: workspaceItemInclude,
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });
}

/** Finds all active document items for legacy document endpoints. */
export function findActiveDocumentItems() {
  return prisma.workspaceItem.findMany({
    where: { deletedAt: null, type: "document" },
    include: workspaceItemInclude,
    orderBy: { updatedAt: "desc" },
  });
}

/** Finds active folders for move-target calculation. */
export function findActiveFolderItems() {
  return prisma.workspaceItem.findMany({
    where: { deletedAt: null, type: "folder" },
    include: workspaceItemInclude,
    orderBy: [{ name: "asc" }],
  });
}

/** Finds active children by parent ids. */
export function findActiveChildrenByParentIds(parentIds: string[]) {
  return prisma.workspaceItem.findMany({
    where: {
      deletedAt: null,
      parentId: { in: parentIds },
    },
    include: workspaceItemInclude,
  });
}

/** Finds an active duplicate name in a root owner scope or folder scope. */
export function findActiveDuplicateName(input: {
  name: string;
  ownerId: string;
  parentId: string | null;
  excludeItemId?: string;
}) {
  return prisma.workspaceItem.findFirst({
    where: {
      deletedAt: null,
      id: input.excludeItemId ? { not: input.excludeItemId } : undefined,
      name: input.name,
      ...(input.parentId
        ? { parentId: input.parentId }
        : { parentId: null, ownerId: input.ownerId }),
    },
    select: { id: true },
  });
}

/** Creates a folder item. */
export function createFolderRecord(input: {
  name: string;
  ownerId: string;
  parentId: string | null;
}) {
  return prisma.workspaceItem.create({
    data: {
      name: input.name,
      ownerId: input.ownerId,
      parentId: input.parentId,
      type: "folder",
    },
    include: workspaceItemInclude,
  });
}

/** Creates a document item and document content row in one transaction. */
export function createDocumentRecord(input: {
  name: string;
  ownerId: string;
  parentId: string | null;
  content: Prisma.InputJsonValue | typeof Prisma.JsonNull;
  editorName: string;
}) {
  return prisma.$transaction(async (tx) => {
    const item = await tx.workspaceItem.create({
      data: {
        name: input.name,
        ownerId: input.ownerId,
        parentId: input.parentId,
        type: "document",
        document: {
          create: {
            content: input.content,
            lastEditedById: input.ownerId,
            lastEditedByName: input.editorName,
            lastOpenedAt: new Date(),
          },
        },
      },
    });

    return tx.workspaceItem.findUniqueOrThrow({
      where: { id: item.id },
      include: workspaceItemInclude,
    });
  });
}

/** Renames an active workspace item. */
export function renameWorkspaceItemRecord(itemId: string, name: string) {
  return prisma.workspaceItem.update({
    where: { id: itemId },
    data: { name },
    include: workspaceItemInclude,
  });
}

/** Moves an active workspace item. */
export function moveWorkspaceItemRecord(itemId: string, targetFolderId: string | null) {
  return prisma.workspaceItem.update({
    where: { id: itemId },
    data: { parentId: targetFolderId },
    include: workspaceItemInclude,
  });
}

/** Soft-deletes workspace items by id. */
export function softDeleteWorkspaceItems(itemIds: string[]) {
  return prisma.workspaceItem.updateMany({
    where: { id: { in: itemIds } },
    data: { deletedAt: new Date() },
  });
}

/** Counts active direct children for a folder. */
export function countActiveChildren(itemId: string) {
  return prisma.workspaceItem.count({
    where: { parentId: itemId, deletedAt: null },
  });
}

/** Upserts direct collaborator access for a workspace item. */
export function upsertWorkspaceCollaborator(input: {
  itemId: string;
  userId: string;
  permission: PermissionLevel;
}) {
  return prisma.workspaceItemCollaborator.upsert({
    where: { itemId_userId: { itemId: input.itemId, userId: input.userId } },
    create: input,
    update: { permission: input.permission },
  });
}

/** Updates a direct collaborator permission. */
export function updateWorkspaceCollaboratorRecord(input: {
  itemId: string;
  userId: string;
  permission: PermissionLevel;
}) {
  return prisma.workspaceItemCollaborator.update({
    where: { itemId_userId: { itemId: input.itemId, userId: input.userId } },
    data: { permission: input.permission },
  });
}

/** Deletes a direct collaborator record if present. */
export function deleteWorkspaceCollaboratorRecord(itemId: string, userId: string) {
  return prisma.workspaceItemCollaborator.deleteMany({
    where: { itemId, userId },
  });
}

/** Updates document content and metadata with optimistic revision checking. */
export function updateDocumentRecordByRevision(input: {
  documentId: string;
  expectedRevision: number;
  data: Prisma.DocumentUncheckedUpdateManyInput;
  itemName?: string;
}) {
  return prisma.$transaction(async (tx) => {
    const updateResult = await tx.document.updateMany({
      where: { id: input.documentId, revision: input.expectedRevision },
      data: input.data,
    });

    if (updateResult.count > 0 && input.itemName) {
      await tx.workspaceItem.update({
        where: { id: input.documentId },
        data: { name: input.itemName },
      });
    }

    return updateResult;
  });
}

/** Reloads an item after a mutation. */
export function reloadWorkspaceItem(itemId: string) {
  return prisma.workspaceItem.findFirst({
    where: { id: itemId, deletedAt: null },
    include: workspaceItemInclude,
  });
}

export type WorkspaceItemRecordType = WorkspaceItemType;
