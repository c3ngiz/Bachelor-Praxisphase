import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { verifyAccessToken } from "../../../../shared/security/jwt.js";
import { findAuthUserById } from "../../auth/auth.repository.js";
import type { RestAuthUser } from "../../auth/auth.dto.js";
import { toRestAuthUser } from "../../auth/auth.mapper.js";

export type AuthenticatedRequest = Request & {
  authUser: RestAuthUser;
};

/** Loads the current REST user from a bearer token. */
export async function requireRestAuth(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  const authorization = request.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    return response.status(StatusCodes.UNAUTHORIZED).json({
      message: "Missing or invalid authorization header.",
    });
  }

  try {
    const token = authorization.slice("Bearer ".length);
    const payload = verifyAccessToken(token);
    const user = await findAuthUserById(payload.sub);

    if (!user) {
      return response.status(StatusCodes.UNAUTHORIZED).json({
        message: "User for this token no longer exists.",
      });
    }

    (request as AuthenticatedRequest).authUser = toRestAuthUser(user);
    return next();
  } catch {
    return response.status(StatusCodes.UNAUTHORIZED).json({
      message: "Invalid or expired token.",
    });
  }
}
