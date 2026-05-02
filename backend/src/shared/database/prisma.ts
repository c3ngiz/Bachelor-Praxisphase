import { PrismaClient } from "@prisma/client";

/** Singleton Prisma client used by both backend applications. */
export const prisma = new PrismaClient();
