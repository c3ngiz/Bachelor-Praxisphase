import type { NextFunction, Request, Response } from "express";

/** Wraps an async REST route handler and forwards rejected promises to Express. */
export function catchAsync(
  handler: (request: Request, response: Response, next: NextFunction) => Promise<unknown>,
) {
  return (request: Request, response: Response, next: NextFunction) => {
    void handler(request, response, next).catch(next);
  };
}
