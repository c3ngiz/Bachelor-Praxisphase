import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import type { AuthenticatedRequest } from "../common/middleware/auth.js";
import { HttpError } from "../common/errors/httpError.js";
import {
  restCreateWorkspaceDto,
  restInviteWorkspaceMemberDto,
} from "./workspace.dto.js";
import {
  createRestWorkspace,
  inviteRestWorkspaceMember,
  listRestWorkspaces,
} from "./workspace.service.js";

function getWorkspaceIdParam(request: Request): string {
  const { workspaceId } = request.params;

  if (typeof workspaceId === "string" && workspaceId.length > 0) {
    return workspaceId;
  }

  throw new HttpError(StatusCodes.BAD_REQUEST, "Invalid workspace id.");
}

/** Lists workspaces for the authenticated REST user. */
export async function listWorkspaces(request: Request, response: Response) {
  const authRequest = request as AuthenticatedRequest;
  const workspaces = await listRestWorkspaces(authRequest.authUser.id);
  return response.status(StatusCodes.OK).json({ workspaces });
}

/** Creates a REST workspace. */
export async function createWorkspace(request: Request, response: Response) {
  const authRequest = request as AuthenticatedRequest;
  const workspace = await createRestWorkspace(
    restCreateWorkspaceDto.parse(request.body),
    authRequest.authUser,
  );
  return response.status(StatusCodes.CREATED).json({ workspace });
}

/** Invites a member to a REST workspace. */
export async function inviteWorkspaceMember(request: Request, response: Response) {
  const authRequest = request as AuthenticatedRequest;
  const workspace = await inviteRestWorkspaceMember(
    getWorkspaceIdParam(request),
    restInviteWorkspaceMemberDto.parse(request.body),
    authRequest.authUser,
  );

  return response.status(StatusCodes.OK).json({ workspace });
}
