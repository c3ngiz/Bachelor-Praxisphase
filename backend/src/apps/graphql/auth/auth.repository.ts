import { prisma } from "../../../shared/database/prisma.js";

/** Finds a GraphQL auth user by email. */
export function findGraphqlUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
}

/** Finds a GraphQL auth user by id. */
export function findGraphqlAuthUserById(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      initials: true,
      avatarColor: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

/** Creates a GraphQL user without provisioning workspace rows. */
export function createGraphqlUser(input: {
  email: string;
  passwordHash: string;
  name: string;
  initials: string;
  avatarColor: string;
}) {
  return prisma.user.create({
    data: input,
  });
}
