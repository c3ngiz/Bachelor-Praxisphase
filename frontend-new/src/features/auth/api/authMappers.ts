import type { AuthResult, AuthUser } from '../types/auth.types';

/** Backend auth user shape shared by REST and GraphQL auth responses. */
export interface BackendAuthUser {
  /** Unique backend user identifier. */
  id: string;
  /** User email address. */
  email: string;
  /** User display name. */
  name: string;
  /** Backend-generated user initials. */
  initials?: string;
  /** Backend avatar color token. */
  avatarColor?: string;
  /** ISO timestamp for user creation. */
  createdAt?: string;
  /** ISO timestamp for the last user update. */
  updatedAt?: string;
}

/** Backend auth payload shape shared by REST and GraphQL auth responses. */
export interface BackendAuthPayload {
  /** Bearer access token. */
  token: string;
  /** Authenticated backend user. */
  user: BackendAuthUser;
}

/**
 * Converts a backend user into the normalized frontend user shape.
 *
 * @param user - User returned by REST or GraphQL backend.
 * @returns Normalized frontend auth user.
 */
export function toAuthUser(user: BackendAuthUser): AuthUser {
  return {
    avatarColor: user.avatarColor,
    createdAt: user.createdAt,
    email: user.email,
    id: user.id,
    initials: user.initials,
    name: user.name,
    updatedAt: user.updatedAt,
  };
}

/**
 * Converts a backend auth payload into a normalized frontend auth result.
 *
 * @param payload - Auth payload returned by REST or GraphQL backend.
 * @returns Normalized authenticated session.
 */
export function toAuthResult(payload: BackendAuthPayload): AuthResult {
  return {
    token: payload.token,
    user: toAuthUser(payload.user),
  };
}
