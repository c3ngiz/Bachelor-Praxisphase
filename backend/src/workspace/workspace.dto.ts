import { z } from "zod";

/** Workspace item names are user-visible and scoped to a parent folder. */
export const workspaceItemNameDto = z.string().trim().min(1).max(200);

/** Nullable parent id accepted by folder/document creation and listing. */
export const workspaceParentIdDto = z.string().min(1).nullable().optional();

/** Read/write permission accepted by sharing endpoints. */
export const workspacePermissionDto = z.enum(["read", "write"]);

/** REST and GraphQL create-folder input validator. */
export const createFolderDto = z.object({
  name: workspaceItemNameDto,
  parentId: workspaceParentIdDto,
});

/** REST and GraphQL create-document input validator. */
export const createDocumentDto = z
  .object({
    name: workspaceItemNameDto.optional(),
    title: workspaceItemNameDto.optional(),
    parentId: workspaceParentIdDto,
    content: z.unknown().optional(),
  })
  .refine((input) => input.name || input.title, {
    message: "Document name is required.",
    path: ["name"],
  });

/** Rename input validator. */
export const renameWorkspaceItemDto = z.object({
  name: workspaceItemNameDto,
});

/** Move input validator. */
export const moveWorkspaceItemDto = z.object({
  targetFolderId: z.string().min(1).nullable().optional(),
});

/** Share input validator supporting both canonical permission and legacy role fields. */
export const shareWorkspaceItemDto = z
  .object({
    email: z.string().email(),
    permission: workspacePermissionDto.optional(),
    role: z.enum(["read", "write", "viewer", "editor"]).optional(),
  })
  .transform((input) => ({
    email: input.email.toLowerCase(),
    permission: normalizePermission(input.permission ?? input.role),
  }));

/** Collaborator permission update input validator. */
export const updateWorkspaceCollaboratorDto = z
  .object({
    permission: workspacePermissionDto.optional(),
    role: z.enum(["read", "write", "viewer", "editor"]).optional(),
  })
  .transform((input) => ({
    permission: normalizePermission(input.permission ?? input.role),
  }));

/** Legacy document update validator used by `/api/documents/:documentId`. */
export const updateDocumentContentDto = z.object({
  expectedRevision: z.number().int().positive(),
  title: workspaceItemNameDto.optional(),
  content: z.unknown().optional(),
  lastOpenedAt: z.string().datetime().optional().nullable(),
});

export type CreateFolderInput = z.infer<typeof createFolderDto>;
export type CreateDocumentInput = z.infer<typeof createDocumentDto>;
export type RenameWorkspaceItemInput = z.infer<typeof renameWorkspaceItemDto>;
export type MoveWorkspaceItemInput = z.infer<typeof moveWorkspaceItemDto>;
export type ShareWorkspaceItemInput = z.infer<typeof shareWorkspaceItemDto>;
export type UpdateWorkspaceCollaboratorInput = z.infer<typeof updateWorkspaceCollaboratorDto>;
export type UpdateDocumentContentInput = z.infer<typeof updateDocumentContentDto>;

/**
 * Normalizes frontend and legacy role names into persisted read/write values.
 *
 * @param value - Permission or legacy role value.
 * @returns Canonical read/write permission.
 */
function normalizePermission(value: string | undefined): "read" | "write" {
  if (value === "write" || value === "editor") {
    return "write";
  }

  return "read";
}
