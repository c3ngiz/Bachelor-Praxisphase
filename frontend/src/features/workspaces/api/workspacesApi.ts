import { BACKEND_KIND, graphqlRequest, restRequest } from "@/shared/lib/api";

import type {
  CreateWorkspaceInput,
  InviteWorkspaceMemberInput,
  Workspace,
} from "../types/workspace.types";

const memberFields = `
  id
  userId
  email
  name
  initials
  avatarColor
  role
  createdAt
  updatedAt
`;

const workspaceFields = `
  id
  name
  description
  isDefault
  ownerId
  currentUserRole
  members {
    ${memberFields}
  }
  createdAt
  updatedAt
`;

export async function listWorkspaces(
  token: string,
): Promise<{ workspaces: Workspace[] }> {
  if (BACKEND_KIND === "graphql") {
    const response = await graphqlRequest<{ workspaces: Workspace[] }>({
      query: `
        query Workspaces {
          workspaces {
            ${workspaceFields}
          }
        }
      `,
      token,
    });

    return { workspaces: response.workspaces };
  }

  return restRequest<{ workspaces: Workspace[] }>("/workspaces", { method: "GET", token });
}

export async function createWorkspaceRequest(
  input: CreateWorkspaceInput,
  token: string,
): Promise<{ workspace: Workspace }> {
  if (BACKEND_KIND === "graphql") {
    const response = await graphqlRequest<
      { createWorkspace: Workspace },
      { input: CreateWorkspaceInput }
    >({
      query: `
        mutation CreateWorkspace($input: CreateWorkspaceInput!) {
          createWorkspace(input: $input) {
            ${workspaceFields}
          }
        }
      `,
      variables: { input },
      token,
    });

    return { workspace: response.createWorkspace };
  }

  return restRequest<{ workspace: Workspace }>("/workspaces", {
    method: "POST",
    token,
    body: input,
  });
}

export async function inviteWorkspaceMemberRequest(
  workspaceId: string,
  input: InviteWorkspaceMemberInput,
  token: string,
): Promise<{ workspace: Workspace }> {
  if (BACKEND_KIND === "graphql") {
    const response = await graphqlRequest<
      { inviteWorkspaceMember: Workspace },
      { workspaceId: string; input: InviteWorkspaceMemberInput }
    >({
      query: `
        mutation InviteWorkspaceMember($workspaceId: ID!, $input: InviteWorkspaceMemberInput!) {
          inviteWorkspaceMember(workspaceId: $workspaceId, input: $input) {
            ${workspaceFields}
          }
        }
      `,
      variables: { workspaceId, input },
      token,
    });

    return { workspace: response.inviteWorkspaceMember };
  }

  return restRequest<{ workspace: Workspace }>(`/workspaces/${workspaceId}/members`, {
    method: "POST",
    token,
    body: input,
  });
}
