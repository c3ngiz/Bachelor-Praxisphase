import { prisma } from "../../../shared/database/prisma.js";

export const restWorkspaceInclude = {
  members: {
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          initials: true,
          avatarColor: true,
        },
      },
    },
    orderBy: { createdAt: "asc" as const },
  },
};

/** Lists workspace memberships for a REST user. */
export function findRestWorkspaceMemberships(userId: string) {
  return prisma.workspaceMember.findMany({
    where: { userId },
    include: {
      workspace: {
        include: restWorkspaceInclude,
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

/** Finds a REST workspace by id with member details. */
export function findRestWorkspaceById(workspaceId: string) {
  return prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: restWorkspaceInclude,
  });
}

/** Finds a REST workspace membership and its workspace metadata. */
export function findRestWorkspaceMembership(workspaceId: string, userId: string) {
  return prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId,
      },
    },
    include: {
      workspace: true,
    },
  });
}

/** Finds the default workspace id for a REST user. */
export function findRestDefaultWorkspaceId(userId: string) {
  return prisma.workspace.findFirst({
    where: {
      ownerId: userId,
      isDefault: true,
    },
    select: { id: true },
  });
}

/** Creates a non-default REST workspace. */
export function createRestWorkspaceRecord(input: {
  name: string;
  description?: string;
  ownerId: string;
}) {
  return prisma.workspace.create({
    data: {
      name: input.name,
      description: input.description,
      isDefault: false,
      ownerId: input.ownerId,
      members: {
        create: {
          userId: input.ownerId,
          role: "owner",
        },
      },
    },
    include: restWorkspaceInclude,
  });
}

/** Finds a user id by email for REST workspace invitations. */
export function findRestWorkspaceInvitee(email: string) {
  return prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true },
  });
}

/** Upserts a REST workspace member role. */
export function upsertRestWorkspaceMember(input: {
  workspaceId: string;
  userId: string;
  role: "owner" | "editor" | "viewer";
}) {
  return prisma.workspaceMember.upsert({
    where: {
      workspaceId_userId: {
        workspaceId: input.workspaceId,
        userId: input.userId,
      },
    },
    create: input,
    update: {
      role: input.role,
    },
  });
}

/** Promotes private documents in a shared REST workspace to workspace visibility. */
export function promoteRestPrivateDocumentsToWorkspace(workspaceId: string) {
  return prisma.document.updateMany({
    where: {
      workspaceId,
      visibility: "private",
    },
    data: {
      visibility: "workspace",
    },
  });
}

/** Reloads a REST workspace after mutation. */
export function findRestWorkspaceByIdOrThrow(workspaceId: string) {
  return prisma.workspace.findUniqueOrThrow({
    where: { id: workspaceId },
    include: restWorkspaceInclude,
  });
}
