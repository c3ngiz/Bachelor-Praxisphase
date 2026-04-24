import { Router } from "express";

import { requireAuth } from "../../middleware/auth.js";
import { catchAsync } from "../../utils/catchAsync.js";
import * as workspaceController from "./workspace.controller.js";

export const workspaceRouter = Router();

workspaceRouter.use(requireAuth);
workspaceRouter.get("/", catchAsync(workspaceController.listWorkspaces));
workspaceRouter.post("/", catchAsync(workspaceController.createWorkspace));
workspaceRouter.post(
  "/:workspaceId/members",
  catchAsync(workspaceController.inviteWorkspaceMember),
);
