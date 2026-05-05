import { useCallback, useState } from 'react';
import { authService } from '../services/authService';
import type { AuthUser, LoginCredentials } from '../types/auth.types';

/** Return value for the authentication hook. */
export interface UseAuthResult {
  /** Currently authenticated user, when available. */
  user: AuthUser | null;
  /** Whether an auth request is currently pending. */
  isLoading: boolean;
  /** Starts a mocked login request. */
  login: (credentials: LoginCredentials) => Promise<void>;
}

/** Provides local authentication state for auth screens. */
export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    const authenticatedUser = await authService.login(credentials);
    setUser(authenticatedUser);
    setIsLoading(false);
  }, []);

  return { user, isLoading, login };
}
