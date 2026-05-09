const authTokenStorageKey = 'frontend-new.auth.token';

/**
 * Safely reads browser local storage when it is available.
 *
 * @returns The current local storage object, or null outside the browser.
 */
function getLocalStorage(): Storage | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage;
}

/** Centralized bearer token storage for authentication API clients. */
export const authTokenStorage = {
  /**
   * Reads the persisted bearer token.
   *
   * @returns Stored bearer token, or null when none exists.
   */
  getToken(): string | null {
    return getLocalStorage()?.getItem(authTokenStorageKey) ?? null;
  },

  /**
   * Persists the bearer token for page reloads.
   *
   * @param token - Bearer access token returned by the backend.
   */
  setToken(token: string): void {
    getLocalStorage()?.setItem(authTokenStorageKey, token);
  },

  /** Clears the persisted bearer token. */
  clearToken(): void {
    getLocalStorage()?.removeItem(authTokenStorageKey);
  },
};
