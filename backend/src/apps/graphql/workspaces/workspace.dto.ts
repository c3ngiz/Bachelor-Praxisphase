import { z } from "zod";

/** GraphQL workspace role values. */
export const graphqlWorkspaceRoleDto = z.enum(["owner", "editor", "viewer"]);

/** GraphQL createWorkspace input validator. */
export const graphqlCreateWorkspaceDto = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(240).optional(),
});

/** GraphQL inviteWorkspaceMember input validator. */
export const graphqlInviteWorkspaceMemberDto = z.object({
  email: z.string().email(),
  role: graphqlWorkspaceRoleDto.default("editor"),
});

export type GraphqlWorkspaceRole = z.infer<typeof graphqlWorkspaceRoleDto>;
export type GraphqlCreateWorkspaceInput = z.infer<typeof graphqlCreateWorkspaceDto>;
export type GraphqlInviteWorkspaceMemberInput = z.infer<typeof graphqlInviteWorkspaceMemberDto>;

export type GraphqlWorkspaceMember = {
  id: string;
  userId: string;
  email: string;
  name: string;
  initials: string;
  avatarColor: string;
  role: GraphqlWorkspaceRole;
  createdAt: string;
  updatedAt: string;
};

export type GraphqlWorkspace = {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  ownerId: string;
  currentUserRole: GraphqlWorkspaceRole;
  members: GraphqlWorkspaceMember[];
  createdAt: string;
  updatedAt: string;
};
