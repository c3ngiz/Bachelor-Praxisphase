import { StatusCodes } from "http-status-codes";
import { hashPassword, verifyPassword } from "../../../shared/security/password.js";
import { signAccessToken } from "../../../shared/security/jwt.js";
import { GraphqlBackendError } from "../common/errors.js";
import type {
  GraphqlAuthPayload,
  GraphqlAuthUser,
  GraphqlLoginInput,
  GraphqlRegisterInput,
} from "./auth.dto.js";
import { buildGraphqlInitials, toGraphqlAuthUser } from "./auth.mapper.js";
import {
  createGraphqlUser,
  findGraphqlAuthUserById,
  findGraphqlUserByEmail,
} from "./auth.repository.js";

/** Registers a user through the GraphQL backend. */
export async function registerGraphqlUser(
  input: GraphqlRegisterInput,
): Promise<GraphqlAuthPayload> {
  const email = input.email.toLowerCase();
  const existingUser = await findGraphqlUserByEmail(email);

  if (existingUser) {
    throw new GraphqlBackendError(StatusCodes.CONFLICT, "A user with this email already exists.");
  }

  const user = await createGraphqlUser({
    email,
    passwordHash: await hashPassword(input.password),
    name: input.name.trim(),
    initials: buildGraphqlInitials(input.name),
    avatarColor: input.avatarColor,
  });

  return {
    token: signAccessToken({ sub: user.id, email: user.email }),
    user: toGraphqlAuthUser(user),
  };
}

/** Authenticates a user through the GraphQL backend. */
export async function loginGraphqlUser(input: GraphqlLoginInput): Promise<GraphqlAuthPayload> {
  const user = await findGraphqlUserByEmail(input.email);

  if (!user) {
    throw new GraphqlBackendError(StatusCodes.UNAUTHORIZED, "Invalid email or password.");
  }

  const passwordMatches = await verifyPassword(input.password, user.passwordHash);

  if (!passwordMatches) {
    throw new GraphqlBackendError(StatusCodes.UNAUTHORIZED, "Invalid email or password.");
  }

  return {
    token: signAccessToken({ sub: user.id, email: user.email }),
    user: toGraphqlAuthUser(user),
  };
}

/** Returns the current GraphQL auth user by id. */
export async function getGraphqlMe(userId: string): Promise<GraphqlAuthUser> {
  const user = await findGraphqlAuthUserById(userId);

  if (!user) {
    throw new GraphqlBackendError(StatusCodes.NOT_FOUND, "User not found.");
  }

  return toGraphqlAuthUser(user);
}
