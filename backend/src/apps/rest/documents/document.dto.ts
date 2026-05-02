import { z } from "zod";

const restCollaboratorDto = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(80),
  initials: z.string().min(1).max(4),
  color: z.string().min(1).max(64),
  role: z.enum(["owner", "editor", "viewer"]),
});

/** REST document visibility values. */
export const restDocumentVisibilityDto = z.enum(["private", "shared", "workspace"]);

/** REST create document request body. */
export const restCreateDocumentDto = z.object({
  title: z.string().trim().min(1).max(200),
  content: z.unknown().default({ type: "doc", content: [] }),
  visibility: restDocumentVisibilityDto.default("private"),
  workspaceId: z.string().min(1).optional(),
  collaborators: z.array(restCollaboratorDto).default([]),
});

/** REST update document request body. */
export const restUpdateDocumentDto = z.object({
  expectedRevision: z.number().int().positive(),
  title: z.string().trim().min(1).max(200).optional(),
  content: z.unknown().optional(),
  visibility: restDocumentVisibilityDto.optional(),
  collaborators: z.array(restCollaboratorDto).optional(),
  lastOpenedAt: z.string().datetime().optional().nullable(),
});

/** REST invite collaborator request body. */
export const restInviteDocumentCollaboratorDto = z.object({
  email: z.string().email(),
  role: z.enum(["editor", "viewer"]).default("editor"),
});

export type RestDocumentRole = "owner" | "editor" | "viewer";
export type RestDocumentVisibility = z.infer<typeof restDocumentVisibilityDto>;
export type RestCreateDocumentInput = z.infer<typeof restCreateDocumentDto>;
export type RestUpdateDocumentInput = z.infer<typeof restUpdateDocumentDto>;
export type RestInviteDocumentCollaboratorInput = z.infer<typeof restInviteDocumentCollaboratorDto>;

export type RestDocumentCollaborator = {
  id: string;
  name: string;
  initials: string;
  color: string;
  role: RestDocumentRole;
};

export type RestDocument = {
  id: string;
  title: string;
  content: unknown;
  revision: number;
  author: string;
  createdAt: string;
  updatedAt: string;
  lastOpenedAt?: string;
  visibility: RestDocumentVisibility;
  workspaceId: string;
  ownerId: string;
  ownerName: string;
  collaborators: RestDocumentCollaborator[];
  lastEditedById: string;
  lastEditedByName: string;
  lastEditedAt: string;
};
