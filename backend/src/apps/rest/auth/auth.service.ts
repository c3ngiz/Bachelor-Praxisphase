import { StatusCodes } from "http-status-codes";
import { hashPassword, verifyPassword } from "../../../shared/security/password.js";
import { signAccessToken } from "../../../shared/security/jwt.js";
import { HttpError } from "../common/errors/httpError.js";
import type { RestAuthResponse, RestAuthUser, RestLoginInput, RestRegisterInput } from "./auth.dto.js";
import { buildRestInitials, toRestAuthUser } from "./auth.mapper.js";
import {
  createUser,
  findAuthUserById,
  findUserByEmail,
} from "./auth.repository.js";

/** Registers a REST user. */
export async function registerRestUser(input: RestRegisterInput): Promise<RestAuthResponse> {
  const email = input.email.toLowerCase();
  const existingUser = await findUserByEmail(email);

  if (existingUser) {
    throw new HttpError(StatusCodes.CONFLICT, "A user with this email already exists.");
  }

  const user = await createUser({
    email,
    passwordHash: await hashPassword(input.password),
    name: input.name.trim(),
    initials: buildRestInitials(input.name),
    avatarColor: input.avatarColor,
  });
  const authUser = toRestAuthUser(user);

  return {
    token: signAccessToken({ sub: user.id, email: user.email }),
    user: authUser,
  };
}

/** Authenticates a REST user with email and password. */
export async function loginRestUser(input: RestLoginInput): Promise<RestAuthResponse> {
  const user = await findUserByEmail(input.email);

  if (!user) {
    throw new HttpError(StatusCodes.UNAUTHORIZED, "Invalid email or password.");
  }

  const passwordMatches = await verifyPassword(input.password, user.passwordHash);

  if (!passwordMatches) {
    throw new HttpError(StatusCodes.UNAUTHORIZED, "Invalid email or password.");
  }

  return {
    token: signAccessToken({ sub: user.id, email: user.email }),
    user: toRestAuthUser(user),
  };
}

/** Returns the current REST auth user by id. */
export async function getRestMe(userId: string): Promise<RestAuthUser> {
  const user = await findAuthUserById(userId);

  if (!user) {
    throw new HttpError(StatusCodes.NOT_FOUND, "User not found.");
  }

  return toRestAuthUser(user);
}
