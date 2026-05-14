import { getAvatarColor, getInitials } from '../common/utils/avatar.util.js';

/**
 * Database user shape needed by REST response mappers.
 */
export interface UserRecord {
  /** Unique user identifier. */
  id: string;
  /** Lowercase email address. */
  email: string;
  /** Display name. */
  name: string;
  /** Optional frontend avatar color token. */
  avatarColor?: string | null;
  /** Creation timestamp. */
  createdAt: Date;
  /** Update timestamp. */
  updatedAt: Date;
}

/**
 * User payload returned to the frontend auth and workspace layers.
 */
export interface UserResponse {
  /** Unique user identifier. */
  id: string;
  /** Lowercase email address. */
  email: string;
  /** Display name. */
  name: string;
  /** Initials used by avatar components. */
  initials: string;
  /** Frontend avatar color token. */
  avatarColor: string;
  /** ISO creation timestamp. */
  createdAt: string;
  /** ISO update timestamp. */
  updatedAt: string;
}

/**
 * Maps a database user into the frontend-compatible user summary.
 *
 * @param user - User record loaded from Prisma.
 * @returns Serialized user response.
 */
export function toUserResponse(user: UserRecord): UserResponse {
  return {
    avatarColor: user.avatarColor ?? getAvatarColor(user.email),
    createdAt: user.createdAt.toISOString(),
    email: user.email,
    id: user.id,
    initials: getInitials(user.name, user.email),
    name: user.name,
    updatedAt: user.updatedAt.toISOString(),
  };
}
