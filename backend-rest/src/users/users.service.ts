import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import { getAvatarColor } from '../common/utils/avatar.util.js';
import type { UserRecord } from './user.mapper.js';

/**
 * Encapsulates user persistence and lookup behavior shared by auth and
 * workspace sharing flows.
 */
@Injectable()
export class UsersService {
  /**
   * Creates a user service.
   *
   * @param prisma - Shared Prisma client.
   */
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  /**
   * Creates a new application user with a pre-hashed password.
   *
   * @param input - User creation attributes.
   * @returns Created user record.
   * @throws ConflictException when the email already exists.
   */
  async create(input: {
    avatarColor?: string;
    email: string;
    name: string;
    passwordHash: string;
  }): Promise<UserRecord> {
    const email = this.normalizeEmail(input.email);
    const existing = await this.findByEmail(email);

    if (existing) {
      throw new ConflictException({
        code: 'EMAIL_ALREADY_EXISTS',
        message: 'A user with this email already exists.',
      });
    }

    return this.prisma.user.create({
      data: {
        avatarColor: input.avatarColor ?? getAvatarColor(email),
        email,
        name: input.name.trim(),
        passwordHash: input.passwordHash,
      },
    });
  }

  /**
   * Finds a user by email address.
   *
   * @param email - Email address to normalize and lookup.
   * @returns Matching user or null.
   */
  async findByEmail(email: string): Promise<(UserRecord & { passwordHash: string }) | null> {
    return this.prisma.user.findUnique({
      where: { email: this.normalizeEmail(email) },
    });
  }

  /**
   * Finds a user by identifier.
   *
   * @param userId - User identifier.
   * @returns Matching user or null.
   */
  async findById(userId: string): Promise<(UserRecord & { passwordHash: string }) | null> {
    return this.prisma.user.findUnique({
      where: { id: userId },
    });
  }

  /**
   * Resolves a user by identifier or throws a not-found error.
   *
   * @param userId - User identifier.
   * @returns Matching user.
   * @throws NotFoundException when no user exists.
   */
  async getByIdOrThrow(userId: string): Promise<UserRecord & { passwordHash: string }> {
    const user = await this.findById(userId);

    if (!user) {
      throw new NotFoundException({
        code: 'USER_NOT_FOUND',
        message: 'User not found.',
      });
    }

    return user;
  }

  /**
   * Looks up users by a partial email for collaborator search experiences.
   *
   * @param email - Partial email query.
   * @returns Matching users, capped for typeahead-style calls.
   */
  async searchByEmail(email: string): Promise<UserRecord[]> {
    const query = this.normalizeEmail(email);

    if (query.length < 2) {
      return [];
    }

    return this.prisma.user.findMany({
      orderBy: { email: 'asc' },
      take: 10,
      where: {
        email: {
          contains: query,
          mode: 'insensitive',
        },
      },
    });
  }

  /**
   * Normalizes an email before persistence or lookup.
   *
   * @param email - Raw email input.
   * @returns Lowercase trimmed email.
   */
  normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }
}
