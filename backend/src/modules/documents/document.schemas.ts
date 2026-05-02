import { z } from "zod";

const collaboratorSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(80),
  initials: z.string().min(1).max(4),
  color: z.string().min(1).max(64),
  role: z.enum(["owner", "editor", "viewer"]),
});

const visibilitySchema = z.enum([
  "private",
  "shared",
  "workspace",
]);

export const createDocumentSchema = z.object({
  title: z.string().trim().min(1).max(200),
  content: z.unknown().default({ type: "doc", content: [] }),
  visibility: visibilitySchema.default("private"),
  workspaceId: z.string().min(1).optional(),
  collaborators: z.array(collaboratorSchema).default([]),
});

export const updateDocumentSchema = z.object({
  expectedRevision: z.number().int().positive(),
  title: z.string().trim().min(1).max(200).optional(),
  content: z.unknown().optional(),
  visibility: visibilitySchema.optional(),
  collaborators: z.array(collaboratorSchema).optional(),
  lastOpenedAt: z.string().datetime().optional().nullable(),
});

export const inviteDocumentCollaboratorSchema = z.object({
  email: z.string().email(),
  role: z.enum(["editor", "viewer"]).default("editor"),
});

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
export type InviteDocumentCollaboratorInput = z.infer<typeof inviteDocumentCollaboratorSchema>;
