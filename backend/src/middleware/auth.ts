import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { prisma } from "../lib/prisma.js";
import { verifyAccessToken } from "../lib/jwt.js";

export async function requireAuth(request: Request, response: Response, next: NextFunction) {
  const authorization = request.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    return response.status(StatusCodes.UNAUTHORIZED).json({
      message: "Missing or invalid authorization header.",
    });
  }

  try {
    const token = authorization.slice("Bearer ".length);
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

    if (!user) {
      return response.status(StatusCodes.UNAUTHORIZED).json({
        message: "User for this token no longer exists.",
      });
    }

    request.authUser = {
      ...user,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };

    return next();
  } catch {
    return response.status(StatusCodes.UNAUTHORIZED).json({
      message: "Invalid or expired token.",
    });
  }
}
