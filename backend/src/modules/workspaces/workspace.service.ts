import { StatusCodes } from "http-status-codes";
import type { WorkspaceRole } from "@prisma/client";

import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/apiError.js";
import type { AuthUser } from "../auth/auth.types.js";
import type {
  CreateWorkspaceInput,
  InviteWorkspaceMemberInput,
} from "./workspace.schemas.js";
import type { WorkspaceDto } from "./workspace.types.js";

type WorkspaceWithMembers = {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  members: Array<{
    id: string;
    userId: string;
    role: WorkspaceRole;
    createdAt: Date;
    updatedAt: Date;
    user: {
      id: string;
      email: string;
      name: string;
      initials: string;
      avatarColor: string;
    };
  }>;
};

function toWorkspaceDto(workspace: WorkspaceWithMembers, currentUserId: string): WorkspaceDto {
  const currentMembership = workspace.members.find((member) => member.userId === currentUserId);

  if (!currentMembership) {
    throw new ApiError(StatusCodes.FORBIDDEN, "You do not have access to this workspace.");
  }

  return {
    id: workspace.id,
    name: workspace.name,
    description: workspace.description ?? undefined,
    isDefault: workspace.isDefault,
    ownerId: workspace.ownerId,
    currentUserRole: currentMembership.role,
    members: workspace.members.map((member) => ({
      id: member.id,
      userId: member.userId,
      email: member.user.email,
      name: member.user.name,
      initials: member.user.initials,
      avatarColor: member.user.avatarColor,
      role: member.role,
      createdAt: member.createdAt.toISOString(),
      updatedAt: member.updatedAt.toISOString(),
    })),
    createdAt: workspace.createdAt.toISOString(),
    updatedAt: workspace.updatedAt.toISOString(),
  };
}

const workspaceInclude = {
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

export async function listWorkspaces(userId: string): Promise<WorkspaceDto[]> {
  const memberships = await prisma.workspaceMember.findMany({
    where: { userId },
    include: {
      workspace: {
        include: workspaceInclude,
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return memberships.map((membership) => toWorkspaceDto(membership.workspace, userId));
}

export async function getDefaultWorkspaceId(userId: string): Promise<string> {
  const workspace = await prisma.workspace.findFirst({
    where: {
      ownerId: userId,
      isDefault: true,
    },
    select: { id: true },
  });

  if (!workspace) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Default workspace not found.");
  }

  return workspace.id;
}

export async function createDefaultWorkspaceForUser(
  user: AuthUser,
): Promise<WorkspaceDto> {
  const workspace = await prisma.workspace.create({
    data: {
      name: `${user.name}'s Workspace`,
      description: "Your private default workspace",
      isDefault: true,
      ownerId: user.id,
      members: {
        create: {
          userId: user.id,
          role: "owner",
        },
      },
    },
    include: workspaceInclude,
  });

  return toWorkspaceDto(workspace, user.id);
}

export async function createWorkspace(
  input: CreateWorkspaceInput,
  authUser: AuthUser,
): Promise<WorkspaceDto> {
  const workspace = await prisma.workspace.create({
    data: {
      name: input.name,
      description: input.description,
      isDefault: false,
      ownerId: authUser.id,
      members: {
        create: {
          userId: authUser.id,
          role: "owner",
        },
      },
    },
    include: workspaceInclude,
  });

  return toWorkspaceDto(workspace, authUser.id);
}

export async function inviteWorkspaceMember(
  workspaceId: string,
  input: InviteWorkspaceMemberInput,
  authUser: AuthUser,
): Promise<WorkspaceDto> {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: workspaceInclude,
  });

  if (!workspace) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Workspace not found.");
  }

  if (workspace.isDefault) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "Default workspaces cannot be shared.");
  }

  const currentMembership = workspace.members.find((member) => member.userId === authUser.id);

  if (currentMembership?.role !== "owner") {
    throw new ApiError(StatusCodes.FORBIDDEN, "Only workspace owners can invite members.");
  }

  const invitedUser = await prisma.user.findUnique({
    where: { email: input.email.toLowerCase() },
    select: { id: true },
  });

  if (!invitedUser) {
    throw new ApiError(StatusCodes.NOT_FOUND, "No registered user exists for this email.");
  }

  await prisma.workspaceMember.upsert({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId: invitedUser.id,
      },
    },
    create: {
      workspaceId,
      userId: invitedUser.id,
      role: input.role,
    },
    update: {
      role: input.role,
    },
  });

  const updatedWorkspace = await prisma.workspace.findUniqueOrThrow({
    where: { id: workspaceId },
    include: workspaceInclude,
  });

  return toWorkspaceDto(updatedWorkspace, authUser.id);
}

export async function getWorkspaceMembership(workspaceId: string, userId: string) {
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
