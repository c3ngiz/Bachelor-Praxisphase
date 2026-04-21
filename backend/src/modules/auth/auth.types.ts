export type AuthUser = {
  id: string;
  email: string;
  name: string;
  initials: string;
  avatarColor: string;
  createdAt: string;
  updatedAt: string;
};

export type AuthResponse = {
  token: string;
  user: AuthUser;
};
