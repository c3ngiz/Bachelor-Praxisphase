import { z } from "zod";

export const workspaceRoleSchema = z.enum(["owner", "editor", "viewer"]);

export const createWorkspaceSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(240).optional(),
});

export const inviteWorkspaceMemberSchema = z.object({
  email: z.string().email(),
  role: workspaceRoleSchema.default("editor"),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type InviteWorkspaceMemberInput = z.infer<typeof inviteWorkspaceMemberSchema>;
