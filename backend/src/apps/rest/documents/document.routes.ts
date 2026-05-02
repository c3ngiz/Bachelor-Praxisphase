import { Router } from "express";
import { requireRestAuth } from "../common/middleware/auth.js";
import { catchAsync } from "../common/utils/catchAsync.js";
import * as documentController from "./document.controller.js";

/** Creates REST document routes. */
export function createRestDocumentRouter(): Router {
  const router = Router();

  router.use(requireRestAuth);
  router.get("/", catchAsync(documentController.listDocuments));
  router.get("/:documentId", catchAsync(documentController.getDocumentById));
  router.post("/", catchAsync(documentController.createDocument));
  router.patch("/:documentId", catchAsync(documentController.updateDocument));
  router.post("/:documentId/collaborators", catchAsync(documentController.inviteDocumentCollaborator));
  router.delete("/:documentId", catchAsync(documentController.deleteDocument));

  return router;
}
