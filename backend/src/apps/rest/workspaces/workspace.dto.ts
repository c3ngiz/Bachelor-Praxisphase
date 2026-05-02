import { z } from "zod";

/** REST workspace role values. */
export const restWorkspaceRoleDto = z.enum(["owner", "editor", "viewer"]);

/** REST create workspace request body. */
export const restCreateWorkspaceDto = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(240).optional(),
});

/** REST invite workspace member request body. */
export const restInviteWorkspaceMemberDto = z.object({
  email: z.string().email(),
  role: restWorkspaceRoleDto.default("editor"),
});

export type RestWorkspaceRole = z.infer<typeof restWorkspaceRoleDto>;
export type RestCreateWorkspaceInput = z.infer<typeof restCreateWorkspaceDto>;
export type RestInviteWorkspaceMemberInput = z.infer<typeof restInviteWorkspaceMemberDto>;

export type RestWorkspaceMember = {
  id: string;
  userId: string;
  email: string;
  name: string;
  initials: string;
  avatarColor: string;
  role: RestWorkspaceRole;
  createdAt: string;
  updatedAt: string;
};

export type RestWorkspace = {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  ownerId: string;
  currentUserRole: RestWorkspaceRole;
  members: RestWorkspaceMember[];
  createdAt: string;
  updatedAt: string;
};
