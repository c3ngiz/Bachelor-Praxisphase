import type { LoginCredentials } from '../types/auth.types';

/** Checks whether login credentials contain the required fields. */
export function hasValidCredentials(credentials: LoginCredentials): boolean {
  return Boolean(credentials.email.trim() && credentials.password.trim());
}
