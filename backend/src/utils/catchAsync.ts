import type { NextFunction, Request, Response } from "express";

export function catchAsync(
  fn: (request: Request, response: Response, next: NextFunction) => Promise<unknown>,
) {
  return (request: Request, response: Response, next: NextFunction) => {
    void fn(request, response, next).catch(next);
  };
}
