import { Router } from "express";
import { authRouter } from "../../modules/auth/auth.routes.js";
import { documentRouter } from "../../modules/documents/document.routes.js";
import { workspaceRouter } from "../../modules/workspaces/workspace.routes.js";

export function createRestRouter(): Router {
  const router = Router();

  router.use("/auth", authRouter);
  router.use("/documents", documentRouter);
  router.use("/workspaces", workspaceRouter);

  return router;
}
