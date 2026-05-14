import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PrismaService } from './prisma.service.js';

/**
 * Global database module exposing a singleton Prisma client.
 */
@Global()
@Module({
  exports: [PrismaService],
  imports: [ConfigModule],
  providers: [PrismaService],
})
export class PrismaModule {}
