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

/** Creates a GraphQL user and default workspace in one transaction. */
export function createGraphqlUserWithDefaultWorkspace(input: {
  email: string;
  passwordHash: string;
  name: string;
  initials: string;
  avatarColor: string;
}) {
  return prisma.$transaction(async (tx) => {
    const createdUser = await tx.user.create({
      data: input,
    });

    await tx.workspace.create({
      data: {
        name: `${createdUser.name}'s Workspace`,
        description: "Your private default workspace",
        isDefault: true,
        ownerId: createdUser.id,
        members: {
          create: {
            userId: createdUser.id,
            role: "owner",
          },
        },
      },
    });

    return createdUser;
  });
}
