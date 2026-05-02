import type { RestAuthUser } from "./auth.dto.js";

type AuthUserRecord = {
  id: string;
  email: string;
  name: string;
  initials: string;
  avatarColor: string;
  createdAt: Date;
  updatedAt: Date;
};

/** Builds display initials from a user's name. */
export function buildRestInitials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "U"
  );
}

/** Maps a user database record into the REST auth response shape. */
export function toRestAuthUser(user: AuthUserRecord): RestAuthUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    initials: user.initials,
    avatarColor: user.avatarColor,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}
