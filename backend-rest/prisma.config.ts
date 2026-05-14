import 'dotenv/config';

import { defineConfig, env } from 'prisma/config';

/**
 * Prisma CLI configuration for migrations, generated client output, and seed
 * execution. Prisma 7 reads the database URL from this file instead of the
 * schema datasource block.
 */
export default defineConfig({
  datasource: {
    url: env('DATABASE_URL'),
  },
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  schema: 'prisma/schema.prisma',
});
