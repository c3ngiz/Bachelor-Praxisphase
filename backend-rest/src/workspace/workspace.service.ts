import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import { UsersService } from '../users/users.service.js';
import {
  toCollaboratorResponse,
  toSharePermission,
  toWorkspaceItemResponse,
} from './workspace.mapper.js';
import type {
  CollaboratorResponse,
  MoveTargetResponse,
  WorkspaceAccess,
  WorkspaceBreadcrumbResponse,
  WorkspaceItemResponse,
  WorkspaceItemsResponse,
  WorkspacePermissionLevel,
  WorkspaceRecord,
  WorkspaceSharePermissionValue,
} from './workspace.types.js';

const defaultDocumentContent = {
  content: [{ type: 'paragraph' }],
  type: 'doc',
};

const workspaceItemInclude = {
  _count: {
    select: {
      children: {
        where: {
          deletedAt: null,
        },
      },
    },
  },
  documentContent: {
    select: {
      lastOpenedAt: true,
      revision: true,
    },
  },
  owner: true,
  shares: {
    include: {
      user: true,
    },
    orderBy: {
      createdAt: 'asc' as const,
    },
  },
};

interface AncestorRecord {
  /** Folder identifier. */
  id: string;
  /** Folder display name. */
  name: string;
  /** Folder owner identifier. */
  ownerId: string;
  /** Parent folder identifier. */
  parentId: string | null;
  /** Direct shares for the current user. */
  shares: Array<{
    permission: WorkspaceSharePermissionValue;
    userId: string;
  }>;
}

/**
 * Implements workspace hierarchy, sharing, permissions, and explorer behavior.
 */
@Injectable()
export class WorkspaceService {
  /**
   * Creates a workspace service.
   *
   * @param prisma - Shared Prisma client.
   * @param usersService - User lookup service used by sharing flows.
   */
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(UsersService)
    private readonly usersService: UsersService,
  ) {}

  /**
   * Lists root items or direct children of an accessible folder.
   *
   * Root listing returns the current user's root items plus directly shared
   * items so the frontend can show "shared with me" without a second endpoint.
   *
   * @param userId - Current user identifier.
   * @param parentId - Parent folder identifier, or null for root.
   * @returns Folder listing response.
   */
  async listItems(userId: string, parentId: string | null): Promise<WorkspaceItemsResponse> {
    if (parentId) {
      const parent = await this.getAccessibleRecord(userId, parentId);

      if (parent.type !== 'FOLDER') {
        throw new NotFoundException({
          code: 'FOLDER_NOT_FOUND',
          message: 'Folder not found.',
        });
      }
    }

    const records = parentId
      ? await this.findChildren(parentId)
      : await this.findRootVisibleItems(userId);

    const items = await this.serializeAccessibleItems(userId, records);
    const breadcrumbs = parentId
      ? await this.buildBreadcrumbs(parentId)
      : [{ id: null, name: 'Workspace' }];

    return {
      breadcrumbs,
      folderId: parentId,
      items,
      parentId,
    };
  }

  /**
   * Returns a single accessible workspace item.
   *
   * @param userId - Current user identifier.
   * @param itemId - Item identifier.
   * @returns Serialized item response.
   */
  async getItem(userId: string, itemId: string): Promise<WorkspaceItemResponse> {
    const item = await this.getAccessibleRecord(userId, itemId);
    const access = await this.resolveAccessOrThrow(userId, item);
    return toWorkspaceItemResponse(item, access);
  }

  /**
   * Creates a folder in root or under a writable parent folder.
   *
   * @param userId - Current user identifier.
   * @param input - Folder creation attributes.
   * @returns Created folder response.
   */
  async createFolder(
    userId: string,
    input: { name: string; parentId: string | null },
  ): Promise<WorkspaceItemResponse> {
    const name = this.normalizeItemName(input.name);
    await this.assertWritableParent(userId, input.parentId);
    await this.assertNameAvailable({ name, ownerId: userId, parentId: input.parentId });

    const item = await this.prisma.workspaceItem.create({
      data: {
        name,
        ownerId: userId,
        parentId: input.parentId,
        type: 'FOLDER',
      },
      include: workspaceItemInclude,
    });

    return toWorkspaceItemResponse(item as WorkspaceRecord, {
      direct: false,
      permission: 'owner',
    });
  }

  /**
   * Creates a document shell and its JSON content row.
   *
   * @param userId - Current user identifier.
   * @param input - Document creation attributes.
   * @returns Created document response.
   */
  async createDocument(
    userId: string,
    input: { name: string; parentId: string | null },
  ): Promise<WorkspaceItemResponse> {
    const name = this.normalizeItemName(input.name);
    await this.assertWritableParent(userId, input.parentId);
    await this.assertNameAvailable({ name, ownerId: userId, parentId: input.parentId });

    const item = await this.prisma.workspaceItem.create({
      data: {
        documentContent: {
          create: {
            content: defaultDocumentContent,
          },
        },
        name,
        ownerId: userId,
        parentId: input.parentId,
        type: 'DOCUMENT',
      },
      include: workspaceItemInclude,
    });

    return toWorkspaceItemResponse(item as WorkspaceRecord, {
      direct: false,
      permission: 'owner',
    });
  }

  /**
   * Renames a folder or document when the user has write access.
   *
   * @param userId - Current user identifier.
   * @param itemId - Item identifier.
   * @param name - Replacement name.
   * @returns Updated item response.
   */
  async renameItem(userId: string, itemId: string, name: string): Promise<WorkspaceItemResponse> {
    const item = await this.getAccessibleRecord(userId, itemId);
    const access = await this.resolveAccess(userId, item);
    this.assertCanWrite(access);

    const nextName = this.normalizeItemName(name);
    await this.assertNameAvailable({
      excludeItemId: item.id,
      name: nextName,
      ownerId: item.ownerId,
      parentId: item.parentId,
    });

    const updated = await this.prisma.workspaceItem.update({
      data: { name: nextName },
      include: workspaceItemInclude,
      where: { id: item.id },
    });
    const updatedAccess = await this.resolveAccessOrThrow(userId, updated as WorkspaceRecord);

    return toWorkspaceItemResponse(updated as WorkspaceRecord, updatedAccess);
  }

  /**
   * Soft-deletes an item and all descendants. Only owners may delete.
   *
   * @param userId - Current user identifier.
   * @param itemId - Item identifier.
   */
  async deleteItem(userId: string, itemId: string): Promise<void> {
    const item = await this.getAccessibleRecord(userId, itemId);
    const access = await this.resolveAccessOrThrow(userId, item);

    if (access.permission !== 'owner') {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Only the owner can delete this item.',
      });
    }

    const descendantIds = await this.collectDescendantIds(item.id);
    const deletedAt = new Date();

    await this.prisma.workspaceItem.updateMany({
      data: { deletedAt },
      where: {
        id: {
          in: [item.id, ...descendantIds],
        },
      },
    });
  }

  /**
   * Lists writable folder destinations for the move modal.
   *
   * @param userId - Current user identifier.
   * @param itemId - Item being moved.
   * @returns Move target responses.
   */
  async listMoveTargets(userId: string, itemId: string): Promise<MoveTargetResponse[]> {
    const item = await this.getAccessibleRecord(userId, itemId);
    const itemAccess = await this.resolveAccess(userId, item);
    this.assertCanWrite(itemAccess);

    const folders = (await this.prisma.workspaceItem.findMany({
      include: workspaceItemInclude,
      orderBy: [{ name: 'asc' }],
      where: {
        deletedAt: null,
        type: 'FOLDER',
      },
    })) as WorkspaceRecord[];

    const targets: MoveTargetResponse[] = [
      {
        canMoveHere: item.parentId !== null,
        id: null,
        name: 'Workspace',
        path: 'Workspace',
      },
    ];

    for (const folder of folders) {
      if (item.type === 'FOLDER' && (folder.id === item.id || (await this.isDescendantOf(folder.id, item.id)))) {
        continue;
      }

      const access = await this.resolveAccess(userId, folder);

      if (access && (access.permission === 'owner' || access.permission === 'write')) {
        targets.push({
          canMoveHere: folder.id !== item.parentId,
          id: folder.id,
          name: folder.name,
          path: await this.buildPathLabel(folder.id),
        });
      }
    }

    return targets.sort((left, right) => left.path.localeCompare(right.path));
  }

  /**
   * Moves a workspace item to root or a writable target folder.
   *
   * @param userId - Current user identifier.
   * @param itemId - Item identifier.
   * @param targetFolderId - Destination folder identifier, or null for root.
   * @returns Updated item response.
   */
  async moveItem(
    userId: string,
    itemId: string,
    targetFolderId: string | null,
  ): Promise<WorkspaceItemResponse> {
    const item = await this.getAccessibleRecord(userId, itemId);
    const access = await this.resolveAccess(userId, item);
    this.assertCanWrite(access);

    if (targetFolderId) {
      const target = await this.getAccessibleRecord(userId, targetFolderId);

      if (target.type !== 'FOLDER') {
        throw new NotFoundException({
          code: 'FOLDER_NOT_FOUND',
          message: 'Target folder not found.',
        });
      }

      const targetAccess = await this.resolveAccess(userId, target);
      this.assertCanWrite(targetAccess);

      if (item.type === 'FOLDER' && (item.id === target.id || (await this.isDescendantOf(target.id, item.id)))) {
        throw new ConflictException({
          code: 'INVALID_MOVE_TARGET',
          message: 'A folder cannot be moved into itself or one of its descendants.',
        });
      }
    }

    await this.assertNameAvailable({
      excludeItemId: item.id,
      name: item.name,
      ownerId: item.ownerId,
      parentId: targetFolderId,
    });

    const updated = await this.prisma.workspaceItem.update({
      data: { parentId: targetFolderId },
      include: workspaceItemInclude,
      where: { id: item.id },
    });
    const updatedAccess = await this.resolveAccessOrThrow(userId, updated as WorkspaceRecord);

    return toWorkspaceItemResponse(updated as WorkspaceRecord, updatedAccess);
  }

  /**
   * Shares an item with an existing user by email. Only owners may share.
   *
   * @param userId - Current user identifier.
   * @param itemId - Item identifier.
   * @param input - Share invitation attributes.
   * @returns Updated item response.
   */
  async shareItem(
    userId: string,
    itemId: string,
    input: { email: string; permission: 'read' | 'write' },
  ): Promise<WorkspaceItemResponse> {
    const item = await this.getAccessibleRecord(userId, itemId);
    await this.assertOwner(userId, item);

    const collaborator = await this.usersService.findByEmail(input.email);

    if (!collaborator) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: 'No user with that email exists.',
      });
    }

    if (collaborator.id === item.ownerId) {
      throw new ConflictException({
        code: 'OWNER_CANNOT_BE_SHARED',
        message: 'The owner already has full access.',
      });
    }

    const existing = await this.prisma.workspaceShare.findUnique({
      where: {
        itemId_userId: {
          itemId: item.id,
          userId: collaborator.id,
        },
      },
    });

    if (existing) {
      throw new ConflictException({
        code: 'COLLABORATOR_ALREADY_EXISTS',
        message: 'This user is already a collaborator.',
      });
    }

    await this.prisma.workspaceShare.create({
      data: {
        itemId: item.id,
        permission: toSharePermission(input.permission),
        userId: collaborator.id,
      },
    });

    return this.getItem(userId, item.id);
  }

  /**
   * Lists direct collaborators on an accessible item.
   *
   * @param userId - Current user identifier.
   * @param itemId - Item identifier.
   * @returns Direct collaborator responses.
   */
  async listCollaborators(userId: string, itemId: string): Promise<CollaboratorResponse[]> {
    const item = await this.getAccessibleRecord(userId, itemId);
    return item.shares.map(toCollaboratorResponse);
  }

  /**
   * Updates a direct collaborator permission. Only owners may update.
   *
   * @param userId - Current user identifier.
   * @param itemId - Item identifier.
   * @param collaboratorId - Collaborator user identifier.
   * @param permission - Replacement permission.
   * @returns Updated item response.
   */
  async updateCollaborator(
    userId: string,
    itemId: string,
    collaboratorId: string,
    permission: 'read' | 'write',
  ): Promise<WorkspaceItemResponse> {
    const item = await this.getAccessibleRecord(userId, itemId);
    await this.assertOwner(userId, item);

    await this.getShareOrThrow(item.id, collaboratorId);
    await this.prisma.workspaceShare.update({
      data: { permission: toSharePermission(permission) },
      where: {
        itemId_userId: {
          itemId: item.id,
          userId: collaboratorId,
        },
      },
    });

    return this.getItem(userId, item.id);
  }

  /**
   * Removes a direct collaborator. Only owners may remove collaborators.
   *
   * @param userId - Current user identifier.
   * @param itemId - Item identifier.
   * @param collaboratorId - Collaborator user identifier.
   * @returns Updated item response.
   */
  async removeCollaborator(
    userId: string,
    itemId: string,
    collaboratorId: string,
  ): Promise<WorkspaceItemResponse> {
    const item = await this.getAccessibleRecord(userId, itemId);
    await this.assertOwner(userId, item);

    await this.getShareOrThrow(item.id, collaboratorId);
    await this.prisma.workspaceShare.delete({
      where: {
        itemId_userId: {
          itemId: item.id,
          userId: collaboratorId,
        },
      },
    });

    return this.getItem(userId, item.id);
  }

  /**
   * Loads an item and confirms the user has read access.
   *
   * @param userId - Current user identifier.
   * @param itemId - Item identifier.
   * @returns Accessible workspace record.
   */
  async getAccessibleRecord(userId: string, itemId: string): Promise<WorkspaceRecord> {
    const item = await this.findRecordById(itemId);

    if (!item) {
      throw new NotFoundException({
        code: 'ITEM_NOT_FOUND',
        message: 'Workspace item not found.',
      });
    }

    const access = await this.resolveAccess(userId, item);

    if (!access) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'You do not have access to this item.',
      });
    }

    return item;
  }

  /**
   * Resolves the current user's effective access for an item.
   *
   * Direct item shares override inherited read access, and folder permissions
   * are inherited by descendants. Ancestor ownership grants write access to
   * descendants but not owner-only management rights.
   *
   * @param userId - Current user identifier.
   * @param item - Workspace record.
   * @returns Effective access, or null when inaccessible.
   */
  async resolveAccess(userId: string, item: WorkspaceRecord): Promise<WorkspaceAccess | null> {
    if (item.ownerId === userId) {
      return {
        direct: false,
        permission: 'owner',
      };
    }

    let bestPermission: Exclude<WorkspacePermissionLevel, 'owner'> | null = null;
    let direct = false;
    const directShare = item.shares.find((share) => share.userId === userId);

    if (directShare) {
      bestPermission = this.maxPermission(bestPermission, directShare.permission);
      direct = true;
    }

    const ancestors = await this.loadAncestorsForAccess(userId, item.parentId);

    for (const ancestor of ancestors) {
      if (ancestor.ownerId === userId) {
        bestPermission = this.maxPermission(bestPermission, 'WRITE');
        continue;
      }

      const inheritedShare = ancestor.shares.find((share) => share.userId === userId);

      if (inheritedShare) {
        bestPermission = this.maxPermission(bestPermission, inheritedShare.permission);
      }
    }

    return bestPermission
      ? {
          direct,
          permission: bestPermission,
        }
      : null;
  }

  /**
   * Resolves access for a record that has already passed access checks.
   *
   * @param userId - Current user identifier.
   * @param item - Workspace record.
   * @returns Effective access.
   */
  private async resolveAccessOrThrow(
    userId: string,
    item: WorkspaceRecord,
  ): Promise<WorkspaceAccess> {
    const access = await this.resolveAccess(userId, item);

    if (!access) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'You do not have access to this item.',
      });
    }

    return access;
  }

  /**
   * Asserts that the current user can write a document or item.
   *
   * @param userId - Current user identifier.
   * @param itemId - Item identifier.
   * @returns Accessible item record.
   */
  async assertCanWriteItem(userId: string, itemId: string): Promise<WorkspaceRecord> {
    const item = await this.getAccessibleRecord(userId, itemId);
    const access = await this.resolveAccess(userId, item);
    this.assertCanWrite(access);
    return item;
  }

  /**
   * Asserts that an accessible record is a document.
   *
   * @param item - Workspace record.
   */
  assertDocument(item: WorkspaceRecord): void {
    if (item.type !== 'DOCUMENT') {
      throw new NotFoundException({
        code: 'DOCUMENT_NOT_FOUND',
        message: 'Document not found.',
      });
    }
  }

  /**
   * Finds an active item by identifier.
   *
   * @param itemId - Item identifier.
   * @returns Workspace record or null.
   */
  private async findRecordById(itemId: string): Promise<WorkspaceRecord | null> {
    const item = await this.prisma.workspaceItem.findFirst({
      include: workspaceItemInclude,
      where: {
        deletedAt: null,
        id: itemId,
      },
    });

    return item as WorkspaceRecord | null;
  }

  /**
   * Finds direct children for a folder.
   *
   * @param parentId - Parent folder identifier.
   * @returns Child item records.
   */
  private async findChildren(parentId: string): Promise<WorkspaceRecord[]> {
    return (await this.prisma.workspaceItem.findMany({
      include: workspaceItemInclude,
      orderBy: [{ type: 'desc' }, { name: 'asc' }],
      where: {
        deletedAt: null,
        parentId,
      },
    })) as WorkspaceRecord[];
  }

  /**
   * Finds current-user root items and directly shared items for root listing.
   *
   * @param userId - Current user identifier.
   * @returns Visible root-level records.
   */
  private async findRootVisibleItems(userId: string): Promise<WorkspaceRecord[]> {
    const ownedRoot = (await this.prisma.workspaceItem.findMany({
      include: workspaceItemInclude,
      orderBy: [{ type: 'desc' }, { name: 'asc' }],
      where: {
        deletedAt: null,
        ownerId: userId,
        parentId: null,
      },
    })) as WorkspaceRecord[];

    const directlyShared = (await this.prisma.workspaceItem.findMany({
      include: workspaceItemInclude,
      orderBy: [{ type: 'desc' }, { name: 'asc' }],
      where: {
        deletedAt: null,
        ownerId: { not: userId },
        shares: {
          some: {
            userId,
          },
        },
      },
    })) as WorkspaceRecord[];

    const byId = new Map<string, WorkspaceRecord>();

    for (const item of [...ownedRoot, ...directlyShared]) {
      byId.set(item.id, item);
    }

    return [...byId.values()];
  }

  /**
   * Serializes only records the current user can read.
   *
   * @param userId - Current user identifier.
   * @param records - Candidate workspace records.
   * @returns Serialized visible items.
   */
  private async serializeAccessibleItems(
    userId: string,
    records: WorkspaceRecord[],
  ): Promise<WorkspaceItemResponse[]> {
    const items: WorkspaceItemResponse[] = [];

    for (const record of records) {
      const access = await this.resolveAccess(userId, record);

      if (access) {
        items.push(toWorkspaceItemResponse(record, access));
      }
    }

    return items;
  }

  /**
   * Ensures the parent folder exists and is writable when provided.
   *
   * @param userId - Current user identifier.
   * @param parentId - Parent folder identifier or null.
   */
  private async assertWritableParent(userId: string, parentId: string | null): Promise<void> {
    if (!parentId) {
      return;
    }

    const parent = await this.getAccessibleRecord(userId, parentId);

    if (parent.type !== 'FOLDER') {
      throw new NotFoundException({
        code: 'FOLDER_NOT_FOUND',
        message: 'Parent folder not found.',
      });
    }

    const access = await this.resolveAccess(userId, parent);
    this.assertCanWrite(access);
  }

  /**
   * Ensures no active sibling has the requested name.
   *
   * @param input - Name availability context.
   */
  private async assertNameAvailable(input: {
    excludeItemId?: string;
    name: string;
    ownerId: string;
    parentId: string | null;
  }): Promise<void> {
    const existing = await this.prisma.workspaceItem.findFirst({
      where: {
        deletedAt: null,
        id: input.excludeItemId ? { not: input.excludeItemId } : undefined,
        name: input.name,
        ...(input.parentId
          ? { parentId: input.parentId }
          : { ownerId: input.ownerId, parentId: null }),
      },
    });

    if (existing) {
      throw new ConflictException({
        code: 'DUPLICATE_ITEM_NAME',
        message: 'An item with this name already exists in that folder.',
      });
    }
  }

  /**
   * Asserts that an access result grants write operations.
   *
   * @param access - Access result to inspect.
   */
  private assertCanWrite(access: WorkspaceAccess | null): void {
    if (!access || (access.permission !== 'owner' && access.permission !== 'write')) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Write permission is required for this item.',
      });
    }
  }

  /**
   * Asserts that the current user owns an item.
   *
   * @param userId - Current user identifier.
   * @param item - Workspace item.
   */
  private async assertOwner(userId: string, item: WorkspaceRecord): Promise<void> {
    const access = await this.resolveAccess(userId, item);

    if (access?.permission !== 'owner') {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Only the owner can manage sharing for this item.',
      });
    }
  }

  /**
   * Finds a direct share or throws a not-found error.
   *
   * @param itemId - Shared item identifier.
   * @param userId - Collaborator user identifier.
   * @returns Share record.
   */
  private async getShareOrThrow(itemId: string, userId: string) {
    const share = await this.prisma.workspaceShare.findUnique({
      where: {
        itemId_userId: {
          itemId,
          userId,
        },
      },
    });

    if (!share) {
      throw new NotFoundException({
        code: 'COLLABORATOR_NOT_FOUND',
        message: 'Collaborator not found.',
      });
    }

    return share;
  }

  /**
   * Collects all descendant identifiers for soft deletion.
   *
   * @param itemId - Root item identifier.
   * @returns Descendant item identifiers.
   */
  private async collectDescendantIds(itemId: string): Promise<string[]> {
    const descendantIds: string[] = [];
    let frontier = [itemId];

    while (frontier.length > 0) {
      const children = await this.prisma.workspaceItem.findMany({
        select: { id: true },
        where: {
          deletedAt: null,
          parentId: {
            in: frontier,
          },
        },
      });

      frontier = children.map((child) => child.id);
      descendantIds.push(...frontier);
    }

    return descendantIds;
  }

  /**
   * Checks whether a folder is nested below another folder.
   *
   * @param itemId - Candidate descendant identifier.
   * @param ancestorId - Candidate ancestor identifier.
   * @returns True when itemId is below ancestorId.
   */
  private async isDescendantOf(itemId: string, ancestorId: string): Promise<boolean> {
    let currentId: string | null = itemId;
    const seen = new Set<string>();

    while (currentId) {
      if (currentId === ancestorId) {
        return true;
      }

      if (seen.has(currentId)) {
        return false;
      }

      seen.add(currentId);
      const current: { parentId: string | null } | null = await this.prisma.workspaceItem.findFirst({
        select: { parentId: true },
        where: {
          deletedAt: null,
          id: currentId,
        },
      });

      currentId = current?.parentId ?? null;
    }

    return false;
  }

  /**
   * Loads ancestor folders with shares limited to the current user.
   *
   * @param userId - Current user identifier.
   * @param parentId - Starting parent folder identifier.
   * @returns Ancestors from nearest parent upward.
   */
  private async loadAncestorsForAccess(
    userId: string,
    parentId: string | null,
  ): Promise<AncestorRecord[]> {
    const ancestors: AncestorRecord[] = [];
    let currentParentId = parentId;
    const seen = new Set<string>();

    while (currentParentId) {
      if (seen.has(currentParentId)) {
        break;
      }

      seen.add(currentParentId);
      const ancestor = await this.prisma.workspaceItem.findFirst({
        select: {
          id: true,
          name: true,
          ownerId: true,
          parentId: true,
          shares: {
            select: {
              permission: true,
              userId: true,
            },
            where: {
              userId,
            },
          },
        },
        where: {
          deletedAt: null,
          id: currentParentId,
          type: 'FOLDER',
        },
      });

      if (!ancestor) {
        break;
      }

      ancestors.push(ancestor as AncestorRecord);
      currentParentId = ancestor.parentId;
    }

    return ancestors;
  }

  /**
   * Chooses the stronger of two non-owner permissions.
   *
   * @param current - Current best permission.
   * @param next - Candidate database permission.
   * @returns Strongest permission.
   */
  private maxPermission(
    current: Exclude<WorkspacePermissionLevel, 'owner'> | null,
    next: WorkspaceSharePermissionValue,
  ): Exclude<WorkspacePermissionLevel, 'owner'> {
    if (current === 'write' || next === 'WRITE') {
      return 'write';
    }

    return 'read';
  }

  /**
   * Builds breadcrumbs for a folder listing.
   *
   * @param folderId - Current folder identifier.
   * @returns Breadcrumb path including root.
   */
  private async buildBreadcrumbs(folderId: string): Promise<WorkspaceBreadcrumbResponse[]> {
    const segments: WorkspaceBreadcrumbResponse[] = [];
    let currentId: string | null = folderId;
    const seen = new Set<string>();

    while (currentId) {
      if (seen.has(currentId)) {
        break;
      }

      seen.add(currentId);
      const folder: { id: string; name: string; parentId: string | null } | null =
        await this.prisma.workspaceItem.findFirst({
        select: {
          id: true,
          name: true,
          parentId: true,
        },
        where: {
          deletedAt: null,
          id: currentId,
          type: 'FOLDER',
        },
        });

      if (!folder) {
        break;
      }

      segments.unshift({ id: folder.id, name: folder.name });
      currentId = folder.parentId;
    }

    return [{ id: null, name: 'Workspace' }, ...segments];
  }

  /**
   * Builds a readable move-target path.
   *
   * @param folderId - Folder identifier.
   * @returns Slash-separated folder path.
   */
  private async buildPathLabel(folderId: string): Promise<string> {
    const breadcrumbs = await this.buildBreadcrumbs(folderId);
    return breadcrumbs.map((breadcrumb) => breadcrumb.name).join(' / ');
  }

  /**
   * Normalizes item names before validation and persistence.
   *
   * @param name - Raw item name.
   * @returns Trimmed item name.
   */
  private normalizeItemName(name: string): string {
    return name.trim();
  }
}
