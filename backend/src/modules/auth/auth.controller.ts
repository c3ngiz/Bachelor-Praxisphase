import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { loginSchema, registerSchema } from "./auth.schemas.js";
import * as authService from "./auth.service.js";

export async function register(request: Request, response: Response) {
  const input = registerSchema.parse(request.body);
  const result = await authService.register(input);

  return response.status(StatusCodes.CREATED).json(result);
}

export async function login(request: Request, response: Response) {
  const input = loginSchema.parse(request.body);
  const result = await authService.login(input);

  return response.status(StatusCodes.OK).json(result);
}

export async function getMe(request: Request, response: Response) {
  const user = await authService.getMe(request.authUser!.id);
  return response.status(StatusCodes.OK).json({ user });
}
