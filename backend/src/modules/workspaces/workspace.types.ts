export type WorkspaceRole = "owner" | "editor" | "viewer";

export type WorkspaceMemberDto = {
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

export type WorkspaceDto = {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  ownerId: string;
  currentUserRole: WorkspaceRole;
  members: WorkspaceMemberDto[];
  createdAt: string;
  updatedAt: string;
};
