import { env } from '../../../config/env';
import { GraphqlAuthClient } from '../api/graphql/graphqlAuthClient';
import { RestAuthClient } from '../api/rest/restAuthClient';
import { authTokenStorage } from '../api/authTokenStorage';
import type {
  AuthClient,
  AuthResult,
  AuthUser,
  SignInInput,
  SignUpInput,
} from '../types/auth.types';
import { resetApplicationState } from '../utils/sessionCleanup';

/**
 * Creates the auth client implementation selected by environment config.
 *
 * @returns REST or GraphQL auth client.
 */
function createAuthClient(): AuthClient {
  if (env.apiMode === 'graphql') {
    return new GraphqlAuthClient();
  }

  return new RestAuthClient();
}

const authClient = createAuthClient();

/** Frontend-facing authentication facade used by hooks and UI components. */
export const authService = {
  /**
   * Registers a new user and persists the returned bearer token.
   *
   * @param input - Sign-up request input.
   * @returns Authenticated session returned by the selected backend.
   */
  async signUp(input: SignUpInput): Promise<AuthResult> {
    const result = await authClient.signUp(input);
    authTokenStorage.setToken(result.token);
    return result;
  },

  /**
   * Authenticates an existing user and persists the returned bearer token.
   *
   * @param input - Sign-in request input.
   * @returns Authenticated session returned by the selected backend.
   */
  async signIn(input: SignInInput): Promise<AuthResult> {
    const result = await authClient.signIn(input);
    authTokenStorage.setToken(result.token);
    return result;
  },

  /**
   * Backward-compatible sign-in alias for older callers.
   *
   * @param input - Sign-in request input.
   * @returns Authenticated user returned by the selected backend.
   */
  async login(input: SignInInput): Promise<AuthUser> {
    const result = await this.signIn(input);
    return result.user;
  },

  /**
   * Clears frontend auth state and notifies the selected client.
   *
   * Current backends use bearer tokens and expose no sign-out endpoint.
   */
  async signOut(): Promise<void> {
    try {
      await authClient.signOut();
    } finally {
      resetApplicationState();
    }
  },

  /**
   * Loads the current user from the selected backend using the stored token.
   *
   * @returns Current authenticated user, or null when no valid token exists.
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    return authClient.getCurrentUser();
  },
};
