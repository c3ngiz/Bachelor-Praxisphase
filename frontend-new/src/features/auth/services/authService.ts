import type { AuthUser, LoginCredentials } from '../types/auth.types';

/** Service facade for authentication workflows. */
export const authService = {
  /** Returns a mocked authenticated user for valid-looking credentials. */
  async login(credentials: LoginCredentials): Promise<AuthUser> {
    return {
      id: 'user-1',
      name: credentials.email.split('@')[0] || 'User',
      email: credentials.email,
    };
  },
};
