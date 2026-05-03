import { BACKEND_KIND, graphqlRequest, restRequest } from "@/shared/lib/api";
import type { AuthResponse, LoginInput, RegisterInput, User } from "../types";

const authFields = `
  id
  email
  name
  initials
  avatarColor
  createdAt
  updatedAt
`;

export async function registerUser(input: RegisterInput): Promise<AuthResponse> {
  if (BACKEND_KIND === "graphql") {
    const response = await graphqlRequest<{ register: AuthResponse }>({
      query: `
        mutation Register($input: RegisterInput!) {
          register(input: $input) {
            token
            user {
              ${authFields}
            }
          }
        }
      `,
      variables: { input },
    });

    return response.register;
  }

  return restRequest<AuthResponse>("/auth/register", { method: "POST", body: input });
}

export async function loginUser(input: LoginInput): Promise<AuthResponse> {
  if (BACKEND_KIND === "graphql") {
    const response = await graphqlRequest<{ login: AuthResponse }>({
      query: `
        mutation Login($input: LoginInput!) {
          login(input: $input) {
            token
            user {
              ${authFields}
            }
          }
        }
      `,
      variables: { input },
    });

    return response.login;
  }

  return restRequest<AuthResponse>("/auth/login", { method: "POST", body: input });
}

export async function getCurrentUser(token: string): Promise<{ user: User }> {
  if (BACKEND_KIND === "graphql") {
    const response = await graphqlRequest<{ me: User }>({
      query: `
        query Me {
          me {
            ${authFields}
          }
        }
      `,
      token,
    });

    return { user: response.me };
  }

  return restRequest<{ user: User }>("/auth/me", { method: "GET", token });
}
