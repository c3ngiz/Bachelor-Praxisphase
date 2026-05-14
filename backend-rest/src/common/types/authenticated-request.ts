import type { Request } from 'express';

/**
 * Authenticated user payload attached to requests after JWT validation.
 */
export interface RequestUser {
  /** Unique user identifier from the database. */
  id: string;
  /** Lowercase email address associated with the token subject. */
  email: string;
  /** Display name used by frontend navigation and ownership metadata. */
  name: string;
  /** Optional avatar color token accepted by the frontend avatar components. */
  avatarColor?: string | null;
}

/**
 * Express request shape used by guards, decorators, and protected controllers.
 */
export interface AuthenticatedRequest extends Request {
  /** Current authenticated user resolved by the JWT guard. */
  user: RequestUser;
}
