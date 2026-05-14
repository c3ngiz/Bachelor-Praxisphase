import type { UserResponse } from '../users/user.mapper.js';

/**
 * JWT claims signed by the REST backend.
 */
export interface JwtPayload {
  /** User identifier used as JWT subject. */
  sub: string;
  /** User email included for debugging and guard sanity checks. */
  email: string;
}

/**
 * Frontend-compatible authenticated session response.
 */
export interface AuthSessionResponse {
  /** Bearer access token persisted by the frontend. */
  token: string;
  /** Authenticated user associated with the token. */
  user: UserResponse;
}
