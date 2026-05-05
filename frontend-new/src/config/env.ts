/** Runtime environment values used by the frontend. */
export interface EnvConfig {
  /** Base URL for future API requests. */
  apiBaseUrl: string;
  /** Display name for the application. */
  appName: string;
}

/** Default environment configuration for local development. */
export const env: EnvConfig = {
  apiBaseUrl: '/api',
  appName: 'Frontend New',
};
