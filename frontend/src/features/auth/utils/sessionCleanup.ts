import { AUTH_TOKEN_STORAGE_KEY, authTokenStorage } from '../api/authTokenStorage';

const workspaceStoragePrefixes = [
  'frontend-new.workspace.',
  'frontend-new.documents.',
  'frontend-new.editor.',
];

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

/**
 * Removes all keys matching one of the configured prefixes from storage.
 *
 * @param storage - Browser storage area to clean.
 * @param prefixes - Key prefixes that should be removed.
 */
function removeStorageKeysByPrefix(storage: Storage | null, prefixes: string[]): void {
  if (!storage) {
    return;
  }

  const keysToRemove: string[] = [];

  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);

    if (key && prefixes.some((prefix) => key.startsWith(prefix))) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => storage.removeItem(key));
}

/**
 * Clears persisted authentication credentials from browser storage.
 */
export function clearAuthStorage(): void {
  authTokenStorage.clearToken();
  getBrowserStorage('sessionStorage')?.removeItem(AUTH_TOKEN_STORAGE_KEY);
}

/**
 * Clears workspace-adjacent persisted state that must not leak across users.
 */
export function clearWorkspaceCache(): void {
  removeStorageKeysByPrefix(getBrowserStorage('localStorage'), workspaceStoragePrefixes);
  removeStorageKeysByPrefix(getBrowserStorage('sessionStorage'), workspaceStoragePrefixes);
}

/**
 * Resets browser-persisted application state during logout or stale-session cleanup.
 */
export function resetApplicationState(): void {
  clearAuthStorage();
  clearWorkspaceCache();
}
