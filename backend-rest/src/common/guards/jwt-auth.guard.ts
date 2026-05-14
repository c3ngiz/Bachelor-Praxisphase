import { Inject, Injectable, UnauthorizedException, type CanActivate, type ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import type { JwtPayload } from '../../auth/auth.types.js';
import { UsersService } from '../../users/users.service.js';
import type { AuthenticatedRequest } from '../types/authenticated-request.js';

/**
 * Validates bearer tokens and attaches the current user to protected requests.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  /**
   * Creates a JWT guard.
   *
   * @param jwtService - Nest JWT service configured with the API secret.
   * @param usersService - User lookup service used to reject stale tokens.
   */
  constructor(
    @Inject(JwtService)
    private readonly jwtService: JwtService,
    @Inject(UsersService)
    private readonly usersService: UsersService,
  ) {}

  /**
   * Validates the request Authorization header.
   *
   * @param context - Current request execution context.
   * @returns True when the request is authenticated.
   * @throws UnauthorizedException when the token is missing, invalid, or stale.
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractBearerToken(request.headers.authorization);

    if (!token) {
      throw new UnauthorizedException({
        code: 'UNAUTHENTICATED',
        message: 'Authentication is required.',
      });
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      const user = await this.usersService.findById(payload.sub);

      if (!user) {
        throw new Error('Token subject no longer exists.');
      }

      request.user = {
        avatarColor: user.avatarColor,
        email: user.email,
        id: user.id,
        name: user.name,
      };

      return true;
    } catch {
      throw new UnauthorizedException({
        code: 'INVALID_TOKEN',
        message: 'Your session is invalid or expired.',
      });
    }
  }

  /**
   * Extracts a bearer token from an Authorization header.
   *
   * @param authorization - Raw Authorization header.
   * @returns Bearer token or null.
   */
  private extractBearerToken(authorization: string | undefined): string | null {
    if (!authorization) {
      return null;
    }

    const [scheme, token] = authorization.split(' ');
    return scheme?.toLowerCase() === 'bearer' && token ? token : null;
  }
}
