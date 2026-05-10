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

/** Creates a user for REST auth without provisioning workspace rows. */
export function createUser(input: {
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
