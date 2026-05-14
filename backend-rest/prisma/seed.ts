import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

import { PrismaClient } from '../src/generated/prisma/client.js';

const defaultDocumentContent = {
  content: [{ type: 'paragraph' }],
  type: 'doc',
};

/**
 * Creates a Prisma client for development seed operations.
 *
 * @returns A Prisma client configured with the PostgreSQL driver adapter.
 */
function createSeedClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL is required to seed the database.');
  }

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });
}

/**
 * Ensures that a workspace item exists for the seed user.
 *
 * @param prisma - Prisma client used for seed writes.
 * @param input - Workspace item attributes.
 * @returns The existing or newly created item.
 */
async function ensureWorkspaceItem(
  prisma: PrismaClient,
  input: {
    name: string;
    ownerId: string;
    parentId: string | null;
    type: 'FOLDER' | 'DOCUMENT';
  },
) {
  const existing = await prisma.workspaceItem.findFirst({
    where: {
      deletedAt: null,
      name: input.name,
      ownerId: input.ownerId,
      parentId: input.parentId,
    },
  });

  if (existing) {
    return existing;
  }

  return prisma.workspaceItem.create({
    data: input,
  });
}

/**
 * Seeds development-only users, folders, documents, and one collaborator share.
 */
async function main(): Promise<void> {
  const prisma = createSeedClient();
  const passwordHash = await bcrypt.hash('Password123!', 12);

  const alex = await prisma.user.upsert({
    create: {
      avatarColor: 'bg-emerald-500',
      email: 'alex@example.com',
      name: 'Alex Morgan',
      passwordHash,
    },
    update: {
      avatarColor: 'bg-emerald-500',
      name: 'Alex Morgan',
      passwordHash,
    },
    where: { email: 'alex@example.com' },
  });

  const sam = await prisma.user.upsert({
    create: {
      avatarColor: 'bg-sky-500',
      email: 'sam@example.com',
      name: 'Sam Rivera',
      passwordHash,
    },
    update: {
      avatarColor: 'bg-sky-500',
      name: 'Sam Rivera',
      passwordHash,
    },
    where: { email: 'sam@example.com' },
  });

  const folder = await ensureWorkspaceItem(prisma, {
    name: 'Product Notes',
    ownerId: alex.id,
    parentId: null,
    type: 'FOLDER',
  });

  const document = await ensureWorkspaceItem(prisma, {
    name: 'Launch Plan',
    ownerId: alex.id,
    parentId: folder.id,
    type: 'DOCUMENT',
  });

  await prisma.documentContent.upsert({
    create: {
      content: defaultDocumentContent,
      itemId: document.id,
    },
    update: {
      content: defaultDocumentContent,
    },
    where: { itemId: document.id },
  });

  await prisma.workspaceShare.upsert({
    create: {
      itemId: folder.id,
      permission: 'WRITE',
      userId: sam.id,
    },
    update: {
      permission: 'WRITE',
    },
    where: {
      itemId_userId: {
        itemId: folder.id,
        userId: sam.id,
      },
    },
  });

  await prisma.$disconnect();
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
