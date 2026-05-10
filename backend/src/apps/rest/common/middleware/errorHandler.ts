import type { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { ZodError } from "zod";
import { DomainError } from "../../../../shared/errors/domainError.js";
import { HttpError } from "../errors/httpError.js";

/** Converts REST backend exceptions into JSON HTTP responses. */
export function restErrorHandler(
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction,
) {
  if (error instanceof ZodError) {
    return response.status(StatusCodes.BAD_REQUEST).json({
      message: "Validation failed.",
      issues: error.flatten(),
    });
  }

  if (error instanceof HttpError) {
    return response.status(error.statusCode).json({
      message: error.message,
      ...(error.data && typeof error.data === "object" ? error.data : {}),
    });
  }

  if (error instanceof DomainError) {
    return response.status(error.statusCode).json({
      code: error.code,
      message: error.message,
      ...(error.data && typeof error.data === "object" ? error.data : {}),
    });
  }

  console.error(error);

  return response.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    message: "Internal server error.",
  });
}
