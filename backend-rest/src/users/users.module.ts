import { Module } from '@nestjs/common';

import { UsersService } from './users.service.js';

/**
 * User module used by authentication, sharing, and profile-style endpoints.
 */
@Module({
  exports: [UsersService],
  providers: [UsersService],
})
export class UsersModule {}
