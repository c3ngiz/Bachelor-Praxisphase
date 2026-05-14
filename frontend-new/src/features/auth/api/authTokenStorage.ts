/** Browser storage key used for the persisted bearer token. */
export const AUTH_TOKEN_STORAGE_KEY = 'frontend-new.auth.token';

/**
 * Safely reads a browser storage area when it is available.
 *
 * @param storageName - Browser storage area to read.
 * @returns The requested storage object, or null outside the browser.
 */
function getBrowserStorage(storageName: 'localStorage' | 'sessionStorage'): Storage | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return window[storageName];
}

/** Centralized bearer token storage for authentication API clients. */
export const authTokenStorage = {
  /**
   * Reads the persisted bearer token.
   *
   * @returns Stored bearer token, or null when none exists.
   */
  getToken(): string | null {
    return getBrowserStorage('localStorage')?.getItem(AUTH_TOKEN_STORAGE_KEY) ?? null;
  },

  /**
   * Persists the bearer token for page reloads.
   *
   * @param token - Bearer access token returned by the backend.
   */
  setToken(token: string): void {
    getBrowserStorage('localStorage')?.setItem(AUTH_TOKEN_STORAGE_KEY, token);
  },

  /** Clears the persisted bearer token. */
  clearToken(): void {
    getBrowserStorage('localStorage')?.removeItem(AUTH_TOKEN_STORAGE_KEY);
    getBrowserStorage('sessionStorage')?.removeItem(AUTH_TOKEN_STORAGE_KEY);
  },
};
