import { Router } from "express";
import { requireRestAuth } from "../common/middleware/auth.js";
import { catchAsync } from "../common/utils/catchAsync.js";
import * as workspaceController from "./workspace.controller.js";

/** Creates REST routes for folder-based workspace operations. */
export function createRestWorkspaceItemRouter(): Router {
  const router = Router();

  router.use(requireRestAuth);
  router.get("/items", catchAsync(workspaceController.listItems));
  router.get("/move-targets", catchAsync(workspaceController.getMoveTargets));
  router.get("/items/:itemId", catchAsync(workspaceController.getItem));
  router.post("/folders", catchAsync(workspaceController.createFolderItem));
  router.post("/documents", catchAsync(workspaceController.createDocumentItem));
  router.patch("/items/:itemId", catchAsync(workspaceController.renameItem));
  router.patch("/items/:itemId/rename", catchAsync(workspaceController.renameItem));
  router.patch("/items/:itemId/move", catchAsync(workspaceController.moveItem));
  router.delete("/items/:itemId", catchAsync(workspaceController.deleteItem));
  router.post("/items/:itemId/share", catchAsync(workspaceController.shareItem));
  router.post("/items/:itemId/shares", catchAsync(workspaceController.shareItem));
  router.get("/items/:itemId/collaborators", catchAsync(workspaceController.getCollaborators));
  router.patch(
    "/items/:itemId/collaborators/:userId",
    catchAsync(workspaceController.updateCollaborator),
  );
  router.delete(
    "/items/:itemId/collaborators/:userId",
    catchAsync(workspaceController.removeCollaborator),
  );

  return router;
}
