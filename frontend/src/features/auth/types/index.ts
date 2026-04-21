export type User = {
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
  user: User;
};

export type RegisterInput = {
  email: string;
  password: string;
  name: string;
  avatarColor?: string;
};

export type LoginInput = {
  email: string;
  password: string;
};
