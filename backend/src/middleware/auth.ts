import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { getAuthUserFromToken } from "../apis/shared/providers/authUserProvider.js";

export async function requireAuth(request: Request, response: Response, next: NextFunction) {
  const authorization = request.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    return response.status(StatusCodes.UNAUTHORIZED).json({
      message: "Missing or invalid authorization header.",
    });
  }

  try {
    const token = authorization.slice("Bearer ".length);
    const user = await getAuthUserFromToken(token);

    if (!user) {
      return response.status(StatusCodes.UNAUTHORIZED).json({
        message: "User for this token no longer exists.",
      });
    }

    request.authUser = user;

    return next();
  } catch {
    return response.status(StatusCodes.UNAUTHORIZED).json({
      message: "Invalid or expired token.",
    });
  }
}
