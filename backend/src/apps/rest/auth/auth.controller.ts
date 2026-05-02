import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import type { AuthenticatedRequest } from "../common/middleware/auth.js";
import { restLoginDto, restRegisterDto } from "./auth.dto.js";
import { getRestMe, loginRestUser, registerRestUser } from "./auth.service.js";

/** Handles REST user registration. */
export async function register(request: Request, response: Response) {
  const result = await registerRestUser(restRegisterDto.parse(request.body));
  return response.status(StatusCodes.CREATED).json(result);
}

/** Handles REST user login. */
export async function login(request: Request, response: Response) {
  const result = await loginRestUser(restLoginDto.parse(request.body));
  return response.status(StatusCodes.OK).json(result);
}

/** Returns the authenticated REST user. */
export async function getMe(request: Request, response: Response) {
  const authRequest = request as AuthenticatedRequest;
  const user = await getRestMe(authRequest.authUser.id);
  return response.status(StatusCodes.OK).json({ user });
}
