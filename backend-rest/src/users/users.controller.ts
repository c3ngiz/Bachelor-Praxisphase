import { Controller, Get, Inject, Query, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import type { RequestUser } from '../common/types/authenticated-request.js';
import { toUserResponse, type UserResponse } from './user.mapper.js';
import { UsersService } from './users.service.js';

/**
 * REST endpoints for current-user data and collaborator lookup.
 */
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  /**
   * Creates a users controller.
   *
   * @param usersService - User lookup service.
   */
  constructor(@Inject(UsersService) private readonly usersService: UsersService) {}

  /**
   * Returns the current authenticated user.
   *
   * @param currentUser - User resolved from the bearer token.
   * @returns Current user response.
   */
  @Get('me')
  async me(@CurrentUser() currentUser: RequestUser): Promise<{ user: UserResponse }> {
    const user = await this.usersService.getByIdOrThrow(currentUser.id);
    return { user: toUserResponse(user) };
  }

  /**
   * Searches existing users by email for collaborator invitation flows.
   *
   * @param email - Partial email query.
   * @returns Matching user summaries.
   */
  @Get('search')
  async search(@Query('email') email = ''): Promise<{ users: UserResponse[] }> {
    const users = await this.usersService.searchByEmail(email);
    return { users: users.map(toUserResponse) };
  }
}
