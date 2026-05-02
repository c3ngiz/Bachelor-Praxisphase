import { prisma } from "../../../shared/database/prisma.js";

export const graphqlWorkspaceInclude = {
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

/** Lists workspace memberships for a GraphQL user. */
export function findGraphqlWorkspaceMemberships(userId: string) {
  return prisma.workspaceMember.findMany({
    where: { userId },
    include: {
      workspace: {
        include: graphqlWorkspaceInclude,
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

/** Finds a GraphQL workspace by id. */
export function findGraphqlWorkspaceById(workspaceId: string) {
  return prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: graphqlWorkspaceInclude,
  });
}

/** Finds a GraphQL workspace membership. */
export function findGraphqlWorkspaceMembership(workspaceId: string, userId: string) {
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

/** Finds the default workspace id for a GraphQL user. */
export function findGraphqlDefaultWorkspaceId(userId: string) {
  return prisma.workspace.findFirst({
    where: {
      ownerId: userId,
      isDefault: true,
    },
    select: { id: true },
  });
}

/** Creates a GraphQL workspace. */
export function createGraphqlWorkspaceRecord(input: {
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
    include: graphqlWorkspaceInclude,
  });
}

/** Finds a user id for a GraphQL workspace invite. */
export function findGraphqlWorkspaceInvitee(email: string) {
  return prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true },
  });
}

/** Upserts a GraphQL workspace member role. */
export function upsertGraphqlWorkspaceMember(input: {
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

/** Promotes private documents in a GraphQL workspace to workspace visibility. */
export function promoteGraphqlPrivateDocumentsToWorkspace(workspaceId: string) {
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

/** Reloads a GraphQL workspace after mutation. */
export function findGraphqlWorkspaceByIdOrThrow(workspaceId: string) {
  return prisma.workspace.findUniqueOrThrow({
    where: { id: workspaceId },
    include: graphqlWorkspaceInclude,
  });
}
