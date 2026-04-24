import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

import { ApiError } from "../../utils/apiError.js";
import {
  createWorkspaceSchema,
  inviteWorkspaceMemberSchema,
} from "./workspace.schemas.js";
import * as workspaceService from "./workspace.service.js";

function getWorkspaceIdParam(request: Request): string {
  const { workspaceId } = request.params;

  if (typeof workspaceId === "string" && workspaceId.length > 0) {
    return workspaceId;
  }

  throw new ApiError(StatusCodes.BAD_REQUEST, "Invalid workspace id.");
}

export async function listWorkspaces(request: Request, response: Response) {
  const workspaces = await workspaceService.listWorkspaces(request.authUser!.id);
  return response.status(StatusCodes.OK).json({ workspaces });
}

export async function createWorkspace(request: Request, response: Response) {
  const input = createWorkspaceSchema.parse(request.body);
  const workspace = await workspaceService.createWorkspace(input, request.authUser!);
  return response.status(StatusCodes.CREATED).json({ workspace });
}

export async function inviteWorkspaceMember(request: Request, response: Response) {
  const workspaceId = getWorkspaceIdParam(request);
  const input = inviteWorkspaceMemberSchema.parse(request.body);
  const workspace = await workspaceService.inviteWorkspaceMember(
    workspaceId,
    input,
    request.authUser!,
  );

  return response.status(StatusCodes.OK).json({ workspace });
}
