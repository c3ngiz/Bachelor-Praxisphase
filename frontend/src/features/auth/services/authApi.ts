import { apiRequest } from "@/shared/lib/api";
import type { AuthResponse, LoginInput, RegisterInput, User } from "../types";

export async function registerUser(input: RegisterInput): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/auth/register", {
    method: "POST",
    body: input,
  });
}

export async function loginUser(input: LoginInput): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: input,
  });
}

export async function getCurrentUser(token: string): Promise<{ user: User }> {
  return apiRequest<{ user: User }>("/auth/me", {
    method: "GET",
    token,
  });
}
