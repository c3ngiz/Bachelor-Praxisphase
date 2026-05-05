/** Credentials submitted from the login form. */
export interface LoginCredentials {
  /** User email address. */
  email: string;
  /** User password. */
  password: string;
}

/** Authenticated user summary. */
export interface AuthUser {
  /** Unique user identifier. */
  id: string;
  /** User display name. */
  name: string;
  /** User email address. */
  email: string;
}
