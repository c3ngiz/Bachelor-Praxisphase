import { z } from "zod";
import type { WorkspaceLegacyDocumentResponse } from "../../../workspace/workspace.types.js";

const graphqlCollaboratorDto = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(80),
  initials: z.string().min(1).max(4),
  color: z.string().min(1).max(64),
  role: z.enum(["owner", "editor", "viewer"]),
});

/** GraphQL document visibility values. */
export const graphqlDocumentVisibilityDto = z.enum(["private", "shared", "workspace"]);

/** GraphQL createDocument input validator. */
export const graphqlCreateDocumentDto = z
  .object({
    name: z.string().trim().min(1).max(200).optional(),
    title: z.string().trim().min(1).max(200).optional(),
    content: z.unknown().default({ type: "doc", content: [] }),
    parentId: z.string().min(1).nullable().optional(),
    visibility: graphqlDocumentVisibilityDto.default("private"),
    workspaceId: z.string().min(1).optional(),
    collaborators: z.array(graphqlCollaboratorDto).default([]),
  })
  .refine((input) => input.name || input.title, {
    message: "Document title is required.",
    path: ["title"],
  });

/** GraphQL updateDocument input validator. */
export const graphqlUpdateDocumentDto = z.object({
  expectedRevision: z.number().int().positive(),
  title: z.string().trim().min(1).max(200).optional(),
  content: z.unknown().optional(),
  visibility: graphqlDocumentVisibilityDto.optional(),
  collaborators: z.array(graphqlCollaboratorDto).optional(),
  lastOpenedAt: z.string().datetime().optional().nullable(),
});

/** GraphQL inviteDocumentCollaborator input validator. */
export const graphqlInviteDocumentCollaboratorDto = z.object({
  email: z.string().email(),
  role: z.enum(["editor", "viewer"]).default("editor"),
});

export type GraphqlDocumentRole = "owner" | "editor" | "viewer";
export type GraphqlDocumentVisibility = z.infer<typeof graphqlDocumentVisibilityDto>;
export type GraphqlCreateDocumentInput = z.infer<typeof graphqlCreateDocumentDto>;
export type GraphqlUpdateDocumentInput = z.infer<typeof graphqlUpdateDocumentDto>;
export type GraphqlInviteDocumentCollaboratorInput = z.infer<
  typeof graphqlInviteDocumentCollaboratorDto
>;

export type GraphqlDocumentCollaborator = WorkspaceLegacyDocumentResponse["collaborators"][number];
export type GraphqlDocument = WorkspaceLegacyDocumentResponse;
