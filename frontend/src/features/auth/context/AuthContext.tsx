import { createContext } from "react";
import type { LoginInput, RegisterInput, User } from "../types";

export type AuthContextType = {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loading: boolean;
  login: (token: string, user: User) => void;
  loginUser: (input: LoginInput) => Promise<void>;
  registerUser: (input: RegisterInput) => Promise<void>;
  loginWithCredentials: (input: LoginInput) => Promise<void>;
  registerWithCredentials: (input: RegisterInput) => Promise<void>;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
