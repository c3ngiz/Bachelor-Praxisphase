import { createContext } from "react";
import type { LoginInput, RegisterInput, User } from "../types";

export type AuthContextType = {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  loginWithCredentials: (input: LoginInput) => Promise<void>;
  registerWithCredentials: (input: RegisterInput) => Promise<void>;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
