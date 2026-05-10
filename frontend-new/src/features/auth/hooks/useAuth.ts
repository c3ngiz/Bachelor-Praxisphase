import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { normalizeApiError } from '../api/authApiError';
import { authService } from '../services/authService';
import type { ApiError, AuthUser, SignInInput, SignUpInput } from '../types/auth.types';

/** Props accepted by the authentication provider. */
export interface AuthProviderProps {
  /** React tree that should receive authentication state. */
  children: ReactNode;
}

/** Return value for the authentication hook. */
export interface UseAuthResult {
  /** Currently authenticated user, when available. */
  user: AuthUser | null;
  /** Whether any auth request is currently pending. */
  isLoading: boolean;
  /** Whether the initial session refresh has completed. */
  isInitialized: boolean;
  /** Last normalized auth error, when available. */
  error: ApiError | null;
  /** Whether a user is currently authenticated. */
  isAuthenticated: boolean;
  /**
   * Starts a sign-in request.
   *
   * @param input - Sign-in form values.
   */
  signIn: (input: SignInInput) => Promise<void>;
  /**
   * Starts a sign-up request.
   *
   * @param input - Sign-up form values.
   */
  signUp: (input: SignUpInput) => Promise<void>;
  /** Clears the current authenticated session. */
  signOut: () => Promise<void>;
  /** Reloads the current user from the configured backend. */
  refreshCurrentUser: () => Promise<void>;
  /**
   * Backward-compatible sign-in alias for older callers.
   *
   * @param input - Sign-in form values.
   */
  login: (input: SignInInput) => Promise<void>;
}

const AuthContext = createContext<UseAuthResult | null>(null);

/**
 * Provides authentication state and actions to the application.
 *
 * The provider refreshes the current user on mount when a bearer token is
 * available, and clears stale sessions when refresh fails.
 *
 * @param props - Provider props.
 * @returns Provider element wrapping the application tree.
 */
export function AuthProvider({ children }: AuthProviderProps): JSX.Element {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const didInitialRefresh = useRef(false);

  const runAuthRequest = useCallback(async (request: () => Promise<AuthUser | null>) => {
    setIsLoading(true);
    setError(null);

    try {
      const nextUser = await request();
      setUser(nextUser);
    } catch (requestError) {
      const normalizedError = normalizeApiError(requestError);
      setError(normalizedError);
      throw normalizedError;
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  }, []);

  const signIn = useCallback(
    async (input: SignInInput) => {
      await runAuthRequest(async () => {
        const result = await authService.signIn(input);
        return result.user;
      });
    },
    [runAuthRequest],
  );

  const signUp = useCallback(
    async (input: SignUpInput) => {
      await runAuthRequest(async () => {
        const result = await authService.signUp(input);
        return result.user;
      });
    },
    [runAuthRequest],
  );

  const signOut = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await authService.signOut();
      setUser(null);
      setIsInitialized(true);
    } catch (requestError) {
      const normalizedError = normalizeApiError(requestError);
      setError(normalizedError);
      throw normalizedError;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshCurrentUser = useCallback(async () => {
    await runAuthRequest(() => authService.getCurrentUser());
  }, [runAuthRequest]);

  useEffect(() => {
    if (didInitialRefresh.current) {
      return;
    }

    didInitialRefresh.current = true;

    void refreshCurrentUser().catch(() => {
      void authService.signOut();
      setUser(null);
    });
  }, [refreshCurrentUser]);

  const value = useMemo<UseAuthResult>(
    () => ({
      error,
      isAuthenticated: Boolean(user),
      isInitialized,
      isLoading,
      login: signIn,
      refreshCurrentUser,
      signIn,
      signOut,
      signUp,
      user,
    }),
    [error, isInitialized, isLoading, refreshCurrentUser, signIn, signOut, signUp, user],
  );

  return createElement(AuthContext.Provider, { value }, children);
}

/**
 * Reads authentication state and actions from the nearest auth provider.
 *
 * @returns Authentication state and command functions.
 * @throws Error when used outside `AuthProvider`.
 */
export function useAuth(): UseAuthResult {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider.');
  }

  return context;
}
