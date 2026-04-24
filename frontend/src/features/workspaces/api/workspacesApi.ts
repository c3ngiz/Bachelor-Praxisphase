import { apiRequest } from "@/shared/lib/api";

import type {
  CreateWorkspaceInput,
  InviteWorkspaceMemberInput,
  Workspace,
} from "../types/workspace.types";

export async function listWorkspaces(
  token: string,
): Promise<{ workspaces: Workspace[] }> {
  return apiRequest<{ workspaces: Workspace[] }>("/workspaces", {
    method: "GET",
    token,
  });
}

export async function createWorkspaceRequest(
  input: CreateWorkspaceInput,
  token: string,
): Promise<{ workspace: Workspace }> {
  return apiRequest<{ workspace: Workspace }>("/workspaces", {
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
  return apiRequest<{ workspace: Workspace }>(
    `/workspaces/${workspaceId}/members`,
    {
      method: "POST",
      token,
      body: input,
    },
  );
}
