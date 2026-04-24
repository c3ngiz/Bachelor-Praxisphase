import { StatusCodes } from "http-status-codes";
import { prisma } from "../../lib/prisma.js";
import { hashPassword, verifyPassword } from "../../lib/password.js";
import { signAccessToken } from "../../lib/jwt.js";
import { ApiError } from "../../utils/apiError.js";
import type { AuthResponse, AuthUser } from "./auth.types.js";
import type { LoginInput, RegisterInput } from "./auth.schemas.js";

function buildInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "U";
}

function toAuthUser(user: {
  id: string;
  email: string;
  name: string;
  initials: string;
  avatarColor: string;
  createdAt: Date;
  updatedAt: Date;
}): AuthUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    initials: user.initials,
    avatarColor: user.avatarColor,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export async function register(input: RegisterInput): Promise<AuthResponse> {
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email.toLowerCase() },
  });

  if (existingUser) {
    throw new ApiError(StatusCodes.CONFLICT, "A user with this email already exists.");
  }

  const user = await prisma.$transaction(async (tx) => {
    const createdUser = await tx.user.create({
      data: {
        email: input.email.toLowerCase(),
        passwordHash: await hashPassword(input.password),
        name: input.name.trim(),
        initials: buildInitials(input.name),
        avatarColor: input.avatarColor,
      },
    });

    await tx.workspace.create({
      data: {
        name: `${createdUser.name}'s Workspace`,
        description: "Your private default workspace",
        isDefault: true,
        ownerId: createdUser.id,
        members: {
          create: {
            userId: createdUser.id,
            role: "owner",
          },
        },
      },
    });

    return createdUser;
  });

  const authUser = toAuthUser(user);

  return {
    token: signAccessToken({ sub: user.id, email: user.email }),
    user: authUser,
  };
}

export async function login(input: LoginInput): Promise<AuthResponse> {
  const user = await prisma.user.findUnique({
    where: { email: input.email.toLowerCase() },
  });

  if (!user) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid email or password.");
  }

  const passwordMatches = await verifyPassword(input.password, user.passwordHash);

  if (!passwordMatches) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid email or password.");
  }

  const authUser = toAuthUser(user);

  return {
    token: signAccessToken({ sub: user.id, email: user.email }),
    user: authUser,
  };
}

export async function getMe(userId: string): Promise<AuthUser> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      initials: true,
      avatarColor: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found.");
  }

  return toAuthUser(user);
}
