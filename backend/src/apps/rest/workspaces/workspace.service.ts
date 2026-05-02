import { StatusCodes } from "http-status-codes";
import { HttpError } from "../common/errors/httpError.js";
import type { RestAuthUser } from "../auth/auth.dto.js";
import type {
  RestCreateWorkspaceInput,
  RestInviteWorkspaceMemberInput,
  RestWorkspace,
} from "./workspace.dto.js";
import { toRestWorkspace } from "./workspace.mapper.js";
import {
  createRestWorkspaceRecord,
  findRestDefaultWorkspaceId,
  findRestWorkspaceById,
  findRestWorkspaceByIdOrThrow,
  findRestWorkspaceInvitee,
  findRestWorkspaceMembership,
  findRestWorkspaceMemberships,
  promoteRestPrivateDocumentsToWorkspace,
  upsertRestWorkspaceMember,
} from "./workspace.repository.js";

/** Lists workspaces available to a REST user. */
export async function listRestWorkspaces(userId: string): Promise<RestWorkspace[]> {
  const memberships = await findRestWorkspaceMemberships(userId);
  return memberships.map((membership) => toRestWorkspace(membership.workspace, userId));
}

/** Gets the default workspace id for REST document creation. */
export async function getRestDefaultWorkspaceId(userId: string): Promise<string> {
  const workspace = await findRestDefaultWorkspaceId(userId);

  if (!workspace) {
    throw new HttpError(StatusCodes.NOT_FOUND, "Default workspace not found.");
  }

  return workspace.id;
}

/** Gets a REST workspace membership by workspace and user. */
export function getRestWorkspaceMembership(workspaceId: string, userId: string) {
  return findRestWorkspaceMembership(workspaceId, userId);
}

/** Creates a REST workspace owned by the current user. */
export async function createRestWorkspace(
  input: RestCreateWorkspaceInput,
  authUser: RestAuthUser,
): Promise<RestWorkspace> {
  const workspace = await createRestWorkspaceRecord({
    name: input.name,
    description: input.description,
    ownerId: authUser.id,
  });

  return toRestWorkspace(workspace, authUser.id);
}

/** Invites or updates a REST workspace member. */
export async function inviteRestWorkspaceMember(
  workspaceId: string,
  input: RestInviteWorkspaceMemberInput,
  authUser: RestAuthUser,
): Promise<RestWorkspace> {
  const workspace = await findRestWorkspaceById(workspaceId);

  if (!workspace) {
    throw new HttpError(StatusCodes.NOT_FOUND, "Workspace not found.");
  }

  if (workspace.isDefault) {
    throw new HttpError(StatusCodes.BAD_REQUEST, "Default workspaces cannot be shared.");
  }

  const currentMembership = workspace.members.find((member) => member.userId === authUser.id);

  if (currentMembership?.role !== "owner") {
    throw new HttpError(StatusCodes.FORBIDDEN, "Only workspace owners can invite members.");
  }

  const invitedUser = await findRestWorkspaceInvitee(input.email);

  if (!invitedUser) {
    throw new HttpError(StatusCodes.NOT_FOUND, "No registered user exists for this email.");
  }

  await upsertRestWorkspaceMember({
    workspaceId,
    userId: invitedUser.id,
    role: input.role,
  });
  await promoteRestPrivateDocumentsToWorkspace(workspaceId);

  const updatedWorkspace = await findRestWorkspaceByIdOrThrow(workspaceId);
  return toRestWorkspace(updatedWorkspace, authUser.id);
}
