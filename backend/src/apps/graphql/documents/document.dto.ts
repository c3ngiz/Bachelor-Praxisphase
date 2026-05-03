import { z } from "zod";

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
export const graphqlCreateDocumentDto = z.object({
  title: z.string().trim().min(1).max(200),
  content: z.unknown().default({ type: "doc", content: [] }),
  visibility: graphqlDocumentVisibilityDto.default("private"),
  workspaceId: z.string().min(1).optional(),
  collaborators: z.array(graphqlCollaboratorDto).default([]),
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

export type GraphqlDocumentCollaborator = {
  id: string;
  name: string;
  initials: string;
  color: string;
  role: GraphqlDocumentRole;
};

export type GraphqlDocument = {
  id: string;
  title: string;
  content: unknown;
  revision: number;
  author: string;
  createdAt: string;
  updatedAt: string;
  lastOpenedAt?: string;
  visibility: GraphqlDocumentVisibility;
  workspaceId: string;
  ownerId: string;
  ownerName: string;
  collaborators: GraphqlDocumentCollaborator[];
  currentUserRole: GraphqlDocumentRole | null;
  canEdit: boolean;
  canShare: boolean;
  canDelete: boolean;
  lastEditedById: string;
  lastEditedByName: string;
  lastEditedAt: string;
};
