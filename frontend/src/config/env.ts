/** Backend API transport supported by the frontend authentication layer. */
export type ApiMode = 'rest' | 'graphql';

/** Editor synchronization transport selected for document editor sessions. */
export type EditorSyncMode = 'websocket' | 'polling' | 'subscription';

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
  /** WebSocket URL for GraphQL subscription requests. */
  graphqlWsUrl: string;
  /** WebSocket URL for the plain-text OT collaboration server. */
  collaborationUrl: string;
  /** Active document editor synchronization transport. */
  editorSyncMode: EditorSyncMode;
  /** Delay before autosaving dirty polling/subscription editor changes. */
  editorAutosaveDebounceMs: number;
  /** Interval used by polling editor sync and subscription fallback. */
  editorPollingIntervalMs: number;
  /** Interval used by WebSocket editor hash comparison checks. */
  collaborationHashCheckIntervalMs: number;
  /** Delay before the first divergence hash check after connection changes. */
  collaborationHashCheckDebounceMs: number;
  /** Display name for the application. */
  appName: string;
}

/**
 * Normalizes one-token Vite env values that may include inline comments.
 *
 * @param value - Raw environment variable value.
 * @param fallback - Fallback token.
 * @returns Trimmed token without trailing inline comments.
 */
function readEnvToken(value: string | undefined, fallback: string): string {
  return (value ?? fallback).split(/\s+#/, 1)[0]?.trim() ?? fallback;
}

/**
 * Parses and validates the configured API mode.
 *
 * @param value - Raw environment variable value.
 * @returns A supported API mode.
 * @throws Error when the configured mode is unsupported.
 */
function parseApiMode(value: string | undefined): ApiMode {
  const mode = readEnvToken(value, 'rest');

  if (mode === 'rest' || mode === 'graphql') {
    return mode;
  }

  throw new Error(`Unsupported VITE_API_MODE "${mode}". Expected "rest" or "graphql".`);
}

/**
 * Parses and validates the configured editor synchronization mode.
 *
 * @param value - Raw environment variable value.
 * @returns A supported editor sync mode.
 * @throws Error when the configured mode is unsupported.
 */
function parseEditorSyncMode(value: string | undefined): EditorSyncMode {
  const mode = readEnvToken(value, 'websocket');

  if (mode === 'websocket' || mode === 'polling' || mode === 'subscription') {
    return mode;
  }

  throw new Error(
    `Unsupported VITE_EDITOR_SYNC_MODE "${mode}". Expected "websocket", "polling", or "subscription".`,
  );
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

/**
 * Reads a positive integer Vite environment variable.
 *
 * @param key - Environment variable key.
 * @param fallback - Fallback value used for missing or invalid values.
 * @returns Parsed positive integer value.
 */
function readPositiveIntegerEnvValue(key: string, fallback: number): number {
  const value = Number.parseInt(readEnvValue(key, String(fallback)), 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

/** Runtime environment configuration for local development and deployed builds. */
export const env: EnvConfig = {
  apiMode: parseApiMode(import.meta.env.VITE_API_MODE),
  appName: readEnvValue('VITE_APP_NAME', 'Frontend New'),
  collaborationUrl: readEnvValue('VITE_COLLABORATION_URL', 'ws://localhost:4000'),
  collaborationHashCheckDebounceMs: readPositiveIntegerEnvValue(
    'VITE_COLLABORATION_HASH_CHECK_DEBOUNCE_MS',
    1200,
  ),
  collaborationHashCheckIntervalMs: readPositiveIntegerEnvValue(
    'VITE_COLLABORATION_HASH_CHECK_INTERVAL_MS',
    8000,
  ),
  editorAutosaveDebounceMs: readPositiveIntegerEnvValue('VITE_EDITOR_AUTOSAVE_DEBOUNCE_MS', 900),
  editorPollingIntervalMs: readPositiveIntegerEnvValue('VITE_EDITOR_POLLING_INTERVAL_MS', 2500),
  editorSyncMode: parseEditorSyncMode(import.meta.env.VITE_EDITOR_SYNC_MODE),
  graphqlApiUrl: readEnvValue('VITE_GRAPHQL_API_URL', 'http://localhost:4000/graphql'),
  graphqlWsUrl: readEnvValue('VITE_GRAPHQL_WS_URL', 'ws://localhost:4000/graphql'),
  restApiUrl: readEnvValue('VITE_REST_API_URL', 'http://localhost:4000'),
};
