export type WorkspaceRole = "owner" | "editor" | "viewer";

export type WorkspaceMember = {
  id: string;
  userId: string;
  email: string;
  name: string;
  initials: string;
  avatarColor: string;
  role: WorkspaceRole;
  createdAt: string;
  updatedAt: string;
};

export type Workspace = {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  ownerId: string;
  currentUserRole: WorkspaceRole;
  members: WorkspaceMember[];
  createdAt: string;
  updatedAt: string;
};

export type CreateWorkspaceInput = {
  name: string;
  description?: string;
};

export type InviteWorkspaceMemberInput = {
  email: string;
  role: WorkspaceRole;
};
