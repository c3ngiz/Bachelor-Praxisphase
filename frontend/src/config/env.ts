/** Backend API transport supported by the frontend authentication layer. */
export type ApiMode = 'rest' | 'graphql';

/**
 * Runtime environment values used by the frontend.
 *
 * Values are read from Vite environment variables when present and fall back to
 * local development defaults.
 */
export interface EnvConfig {
  /** Active backend API mode used by frontend services. */
  apiMode: ApiMode;
  /** Base URL for REST API requests. */
  restApiUrl: string;
  /** Endpoint URL for GraphQL API requests. */
  graphqlApiUrl: string;
  /** Display name for the application. */
  appName: string;
}

/**
 * Parses and validates the configured API mode.
 *
 * @param value - Raw environment variable value.
 * @returns A supported API mode.
 * @throws Error when the configured mode is unsupported.
 */
function parseApiMode(value: string | undefined): ApiMode {
  const mode = value ?? 'rest';

  if (mode === 'rest' || mode === 'graphql') {
    return mode;
  }

  throw new Error(`Unsupported VITE_API_MODE "${mode}". Expected "rest" or "graphql".`);
}

/**
 * Reads a Vite environment variable with a fallback.
 *
 * @param key - Environment variable key.
 * @param fallback - Value used when the key is missing or empty.
 * @returns The configured value or fallback.
 */
function readEnvValue(key: string, fallback: string): string {
  const value = import.meta.env[key];
  return typeof value === 'string' && value.length > 0 ? value : fallback;
}

/** Runtime environment configuration for local development and deployed builds. */
export const env: EnvConfig = {
  apiMode: parseApiMode(import.meta.env.VITE_API_MODE),
  appName: readEnvValue('VITE_APP_NAME', 'Frontend New'),
  graphqlApiUrl: readEnvValue('VITE_GRAPHQL_API_URL', 'http://localhost:4000/graphql'),
  restApiUrl: readEnvValue('VITE_REST_API_URL', 'http://localhost:4000/api'),
};
