import { prisma } from "../../../shared/database/prisma.js";

/** Finds a user by lower-cased email for REST auth flows. */
export function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
}

/** Finds a user by id with the fields needed by REST auth responses. */
export function findAuthUserById(userId: string) {
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

/** Creates a user and private default workspace in a single REST auth transaction. */
export function createUserWithDefaultWorkspace(input: {
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
