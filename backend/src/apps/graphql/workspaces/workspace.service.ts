import { StatusCodes } from "http-status-codes";
import type { GraphqlAuthUser } from "../auth/auth.dto.js";
import { GraphqlBackendError } from "../common/errors.js";
import type {
  GraphqlCreateWorkspaceInput,
  GraphqlInviteWorkspaceMemberInput,
  GraphqlWorkspace,
} from "./workspace.dto.js";
import { toGraphqlWorkspace } from "./workspace.mapper.js";
import {
  createGraphqlWorkspaceRecord,
  findGraphqlDefaultWorkspaceId,
  findGraphqlWorkspaceById,
  findGraphqlWorkspaceByIdOrThrow,
  findGraphqlWorkspaceInvitee,
  findGraphqlWorkspaceMembership,
  findGraphqlWorkspaceMemberships,
  promoteGraphqlPrivateDocumentsToWorkspace,
  upsertGraphqlWorkspaceMember,
} from "./workspace.repository.js";

/** Lists workspaces available to a GraphQL user. */
export async function listGraphqlWorkspaces(userId: string): Promise<GraphqlWorkspace[]> {
  const memberships = await findGraphqlWorkspaceMemberships(userId);
  return memberships.map((membership) => toGraphqlWorkspace(membership.workspace, userId));
}

/** Gets the default workspace id for GraphQL document creation. */
export async function getGraphqlDefaultWorkspaceId(userId: string): Promise<string> {
  const workspace = await findGraphqlDefaultWorkspaceId(userId);

  if (!workspace) {
    throw new GraphqlBackendError(StatusCodes.NOT_FOUND, "Default workspace not found.");
  }

  return workspace.id;
}

/** Gets a GraphQL workspace membership by workspace and user. */
export function getGraphqlWorkspaceMembership(workspaceId: string, userId: string) {
  return findGraphqlWorkspaceMembership(workspaceId, userId);
}

/** Creates a workspace through the GraphQL backend. */
export async function createGraphqlWorkspace(
  input: GraphqlCreateWorkspaceInput,
  authUser: GraphqlAuthUser,
): Promise<GraphqlWorkspace> {
  const workspace = await createGraphqlWorkspaceRecord({
    name: input.name,
    description: input.description,
    ownerId: authUser.id,
  });

  return toGraphqlWorkspace(workspace, authUser.id);
}

/** Invites or updates a workspace member through the GraphQL backend. */
export async function inviteGraphqlWorkspaceMember(
  workspaceId: string,
  input: GraphqlInviteWorkspaceMemberInput,
  authUser: GraphqlAuthUser,
): Promise<GraphqlWorkspace> {
  const workspace = await findGraphqlWorkspaceById(workspaceId);

  if (!workspace) {
    throw new GraphqlBackendError(StatusCodes.NOT_FOUND, "Workspace not found.");
  }

  if (workspace.isDefault) {
    throw new GraphqlBackendError(StatusCodes.BAD_REQUEST, "Default workspaces cannot be shared.");
  }

  const currentMembership = workspace.members.find((member) => member.userId === authUser.id);

  if (currentMembership?.role !== "owner") {
    throw new GraphqlBackendError(StatusCodes.FORBIDDEN, "Only workspace owners can invite members.");
  }

  const invitedUser = await findGraphqlWorkspaceInvitee(input.email);

  if (!invitedUser) {
    throw new GraphqlBackendError(StatusCodes.NOT_FOUND, "No registered user exists for this email.");
  }

  await upsertGraphqlWorkspaceMember({
    workspaceId,
    userId: invitedUser.id,
    role: input.role,
  });
  await promoteGraphqlPrivateDocumentsToWorkspace(workspaceId);

  const updatedWorkspace = await findGraphqlWorkspaceByIdOrThrow(workspaceId);
  return toGraphqlWorkspace(updatedWorkspace, authUser.id);
}
