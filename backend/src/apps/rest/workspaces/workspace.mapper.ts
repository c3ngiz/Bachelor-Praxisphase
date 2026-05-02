import { StatusCodes } from "http-status-codes";
import type { WorkspaceRole } from "@prisma/client";
import { HttpError } from "../common/errors/httpError.js";
import type { RestWorkspace } from "./workspace.dto.js";

export type RestWorkspaceWithMembers = {
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

/** Maps a workspace database record into the REST workspace response shape. */
export function toRestWorkspace(workspace: RestWorkspaceWithMembers, currentUserId: string): RestWorkspace {
  const currentMembership = workspace.members.find((member) => member.userId === currentUserId);

  if (!currentMembership) {
    throw new HttpError(StatusCodes.FORBIDDEN, "You do not have access to this workspace.");
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
