import type { GraphqlAuthUser } from "./auth.dto.js";

type GraphqlAuthUserRecord = {
  id: string;
  email: string;
  name: string;
  initials: string;
  avatarColor: string;
  createdAt: Date;
  updatedAt: Date;
};

/** Builds initials for GraphQL auth user payloads. */
export function buildGraphqlInitials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "U"
  );
}

/** Maps a user database record to the GraphQL auth user type. */
export function toGraphqlAuthUser(user: GraphqlAuthUserRecord): GraphqlAuthUser {
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
