import { Router } from "express";
import { catchAsync } from "../../utils/catchAsync.js";
import { requireAuth } from "../../middleware/auth.js";
import * as documentController from "./document.controller.js";

export const documentRouter = Router();

documentRouter.use(requireAuth);
documentRouter.get("/", catchAsync(documentController.listDocuments));
documentRouter.get("/:documentId", catchAsync(documentController.getDocumentById));
documentRouter.post("/", catchAsync(documentController.createDocument));
documentRouter.patch("/:documentId", catchAsync(documentController.updateDocument));
documentRouter.post(
  "/:documentId/collaborators",
  catchAsync(documentController.inviteDocumentCollaborator),
);
documentRouter.delete("/:documentId", catchAsync(documentController.deleteDocument));
