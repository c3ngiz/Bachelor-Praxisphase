import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';

import { UsersService } from '../users/users.service.js';
import { toUserResponse, type UserRecord } from '../users/user.mapper.js';
import type { AuthSessionResponse, JwtPayload } from './auth.types.js';
import type { LoginDto, RegisterDto } from './dto/auth.dto.js';

const passwordHashRounds = 12;

/**
 * Handles registration, login, current-session, and token creation behavior.
 */
@Injectable()
export class AuthService {
  /**
   * Creates an auth service.
   *
   * @param usersService - User persistence service.
   * @param jwtService - JWT signing service.
   */
  constructor(
    @Inject(UsersService)
    private readonly usersService: UsersService,
    @Inject(JwtService)
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Registers a new user and returns an authenticated bearer session.
   *
   * @param input - Registration request body.
   * @returns Frontend-compatible auth session.
   */
  async register(input: RegisterDto): Promise<AuthSessionResponse> {
    const passwordHash = await bcrypt.hash(input.password, passwordHashRounds);
    const user = await this.usersService.create({
      avatarColor: input.avatarColor,
      email: input.email,
      name: input.name,
      passwordHash,
    });

    return this.createSession(user);
  }

  /**
   * Authenticates an existing user and returns a bearer session.
   *
   * @param input - Login request body.
   * @returns Frontend-compatible auth session.
   * @throws UnauthorizedException when credentials are invalid.
   */
  async login(input: LoginDto): Promise<AuthSessionResponse> {
    const user = await this.usersService.findByEmail(input.email);
    const isValid = user ? await bcrypt.compare(input.password, user.passwordHash) : false;

    if (!user || !isValid) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password.',
      });
    }

    return this.createSession(user);
  }

  /**
   * Returns the current authenticated user as a frontend auth payload.
   *
   * @param userId - Current user identifier.
   * @returns Auth user payload.
   */
  async getCurrentUser(userId: string): Promise<{ user: ReturnType<typeof toUserResponse> }> {
    const user = await this.usersService.getByIdOrThrow(userId);
    return { user: toUserResponse(user) };
  }

  /**
   * Creates an auth session for a persisted user.
   *
   * @param user - Persisted user record.
   * @returns Signed token and serialized user.
   */
  private async createSession(user: UserRecord): Promise<AuthSessionResponse> {
    const payload: JwtPayload = {
      email: user.email,
      sub: user.id,
    };
    const token = await this.jwtService.signAsync(payload);

    return {
      token,
      user: toUserResponse(user),
    };
  }
}
