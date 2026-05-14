import { Body, Controller, Get, HttpCode, HttpStatus, Inject, Post, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import type { RequestUser } from '../common/types/authenticated-request.js';
import { AuthService } from './auth.service.js';
import type { AuthSessionResponse } from './auth.types.js';
import { LoginDto, RegisterDto } from './dto/auth.dto.js';

/**
 * REST authentication controller matching the frontend's `/api/auth/*` calls.
 */
@Controller('auth')
export class AuthController {
  /**
   * Creates an auth controller.
   *
   * @param authService - Authentication service.
   */
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  /**
   * Registers a user through the frontend's canonical REST endpoint.
   *
   * @param input - Registration body.
   * @returns Signed session.
   */
  @Post('register')
  register(@Body() input: RegisterDto): Promise<AuthSessionResponse> {
    return this.authService.register(input);
  }

  /**
   * Backward-compatible sign-up alias.
   *
   * @param input - Registration body.
   * @returns Signed session.
   */
  @Post('sign-up')
  signUp(@Body() input: RegisterDto): Promise<AuthSessionResponse> {
    return this.authService.register(input);
  }

  /**
   * Authenticates a user through the frontend's canonical REST endpoint.
   *
   * @param input - Login body.
   * @returns Signed session.
   */
  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() input: LoginDto): Promise<AuthSessionResponse> {
    return this.authService.login(input);
  }

  /**
   * Backward-compatible sign-in alias.
   *
   * @param input - Login body.
   * @returns Signed session.
   */
  @HttpCode(HttpStatus.OK)
  @Post('sign-in')
  signIn(@Body() input: LoginDto): Promise<AuthSessionResponse> {
    return this.authService.login(input);
  }

  /**
   * Returns the authenticated user for stored bearer tokens.
   *
   * @param currentUser - User resolved by the JWT guard.
   * @returns Current user payload.
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@CurrentUser() currentUser: RequestUser): Promise<{ user: AuthSessionResponse['user'] }> {
    return this.authService.getCurrentUser(currentUser.id);
  }

  /**
   * No-op sign-out endpoint for clients that want to notify the backend.
   */
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('sign-out')
  @UseGuards(JwtAuthGuard)
  signOut(): void {
    return undefined;
  }

  /**
   * Logout alias for clients using older route names.
   */
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  logout(): void {
    return undefined;
  }
}
