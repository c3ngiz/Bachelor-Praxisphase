import { prisma } from "../../../lib/prisma.js";
import { verifyAccessToken } from "../../../lib/jwt.js";
import type { AuthUser } from "../../../modules/auth/auth.types.js";

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
    ...user,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export async function getAuthUserFromToken(token: string | null | undefined): Promise<AuthUser | null> {
  if (!token) {
    return null;
  }

  try {
    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
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

    return user ? toAuthUser(user) : null;
  } catch {
    return null;
  }
}
