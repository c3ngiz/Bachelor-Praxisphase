import { StatusCodes } from "http-status-codes";
import { DomainError } from "../shared/errors/domainError.js";
import {
  findActiveWorkspaceItemById,
  findActiveChildrenByParentIds,
} from "./workspace.repository.js";
import type { EffectivePermission, WorkspaceItemWithRelations } from "./workspace.types.js";

const permissionRank: Record<Exclude<EffectivePermission, null>, number> = {
  read: 1,
  write: 2,
  owner: 3,
};

/**
 * Chooses the strongest permission from two candidates.
 *
 * @param current - Current strongest permission.
 * @param candidate - Candidate permission.
 * @returns Strongest permission.
 */
function strongestPermission(
  current: EffectivePermission,
  candidate: EffectivePermission,
): EffectivePermission {
  if (!candidate) {
    return current;
  }

  if (!current) {
    return candidate;
  }

  return permissionRank[candidate] > permissionRank[current] ? candidate : current;
}

/**
 * Computes direct permission for a workspace item.
 *
 * @param item - Workspace item with direct collaborators.
 * @param userId - User whose access is being checked.
 * @returns Direct item permission, excluding inherited ancestors.
 */
export function getDirectPermission(
  item: WorkspaceItemWithRelations,
  userId: string,
): EffectivePermission {
  if (item.ownerId === userId) {
    return "owner";
  }

  return item.collaborators.find((collaborator) => collaborator.userId === userId)?.permission ?? null;
}

/**
 * Computes effective permission including direct and inherited folder shares.
 *
 * Folder shares are inherited dynamically. Direct item ownership remains the
 * only source of `owner`; owning an ancestor grants write access to descendants
 * but not owner-only actions such as sharing or deletion.
 *
 * @param item - Workspace item being checked.
 * @param userId - User whose access is being checked.
 * @returns Effective permission or null when inaccessible.
 */
export async function getEffectivePermission(
  item: WorkspaceItemWithRelations,
  userId: string,
): Promise<EffectivePermission> {
  const directPermission = getDirectPermission(item, userId);

  if (directPermission === "owner") {
    return "owner";
  }

  let permission: EffectivePermission = directPermission;
  let parentId = item.parentId;

  while (parentId) {
    const parent = await findActiveWorkspaceItemById(parentId);

    if (!parent) {
      break;
    }

    if (parent.ownerId === userId) {
      permission = strongestPermission(permission, "write");
    } else {
      permission = strongestPermission(
        permission,
        parent.collaborators.find((collaborator) => collaborator.userId === userId)?.permission ??
          null,
      );
    }

    parentId = parent.parentId;
  }

  return permission;
}

/**
 * Throws when a user cannot read an item.
 *
 * @param item - Workspace item to check.
 * @param userId - User whose access is being checked.
 * @returns Effective permission when readable.
 */
export async function requireReadableItem(
  item: WorkspaceItemWithRelations,
  userId: string,
): Promise<Exclude<EffectivePermission, null>> {
  const permission = await getEffectivePermission(item, userId);

  if (!permission) {
    throw new DomainError(StatusCodes.FORBIDDEN, "FORBIDDEN", "You do not have access to this item.");
  }

  return permission;
}

/**
 * Throws when a user cannot write an item.
 *
 * @param item - Workspace item to check.
 * @param userId - User whose access is being checked.
 * @returns Effective permission when writable.
 */
export async function requireWritableItem(
  item: WorkspaceItemWithRelations,
  userId: string,
): Promise<Exclude<EffectivePermission, null>> {
  const permission = await requireReadableItem(item, userId);

  if (permission !== "owner" && permission !== "write") {
    throw new DomainError(StatusCodes.FORBIDDEN, "FORBIDDEN", "Write permission is required.");
  }

  return permission;
}

/**
 * Throws when a user is not the direct owner of an item.
 *
 * @param item - Workspace item to check.
 * @param userId - User whose access is being checked.
 */
export function requireItemOwner(item: WorkspaceItemWithRelations, userId: string): void {
  if (item.ownerId !== userId) {
    throw new DomainError(
      StatusCodes.FORBIDDEN,
      "FORBIDDEN",
      "Only the item owner can perform this action.",
    );
  }
}

/**
 * Returns all active descendants for a folder in breadth-first order.
 *
 * @param folderId - Folder id.
 * @returns Active descendant items.
 */
export async function getActiveDescendants(
  folderId: string,
): Promise<WorkspaceItemWithRelations[]> {
  const descendants: WorkspaceItemWithRelations[] = [];
  let currentParentIds = [folderId];

  while (currentParentIds.length > 0) {
    const children = await findActiveChildrenByParentIds(currentParentIds);
    descendants.push(...children);
    currentParentIds = children
      .filter((child) => child.type === "folder")
      .map((child) => child.id);
  }

  return descendants;
}

/**
 * Checks whether a folder id belongs to a descendant of another folder.
 *
 * @param folderId - Folder whose descendants should be inspected.
 * @param possibleDescendantId - Candidate descendant id.
 * @returns True when the candidate is a descendant.
 */
export async function isDescendantFolder(
  folderId: string,
  possibleDescendantId: string,
): Promise<boolean> {
  return (await getActiveDescendants(folderId)).some(
    (descendant) => descendant.id === possibleDescendantId && descendant.type === "folder",
  );
}
