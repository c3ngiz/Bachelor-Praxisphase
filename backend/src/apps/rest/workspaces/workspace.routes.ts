import { Router } from "express";
import { requireRestAuth } from "../common/middleware/auth.js";
import { catchAsync } from "../common/utils/catchAsync.js";
import * as workspaceController from "./workspace.controller.js";

/** Creates REST workspace routes. */
export function createRestWorkspaceRouter(): Router {
  const router = Router();

  router.use(requireRestAuth);
  router.get("/", catchAsync(workspaceController.listWorkspaces));
  router.post("/", catchAsync(workspaceController.createWorkspace));
  router.post("/:workspaceId/members", catchAsync(workspaceController.inviteWorkspaceMember));

  return router;
}
