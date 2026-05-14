/** Backend API transport supported by the frontend authentication layer. */
export type ApiMode = 'rest' | 'graphql';

/** Editor synchronization transport supported by the document editor. */
export type EditorTransportMode = 'polling' | 'realtime';

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
  /** WebSocket URL for the Hocuspocus collaboration server. */
  collaborationUrl: string;
  /** Editor content synchronization mode. */
  editorTransport: EditorTransportMode;
  /** Whether the experimental Hocuspocus real-time transport is enabled. */
  enableRealtimeCollaboration: boolean;
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
 * Parses and validates the configured editor transport mode.
 *
 * `polling` keeps document loading and saving on the selected REST/GraphQL
 * API. `realtime` opts into the Hocuspocus/Yjs transport.
 *
 * @param value - Raw environment variable value.
 * @returns A supported editor transport mode.
 * @throws Error when the configured mode is unsupported.
 */
function parseEditorTransportMode(value: string | undefined): EditorTransportMode {
  const mode = readEnvToken(value, 'polling');

  if (mode === 'polling' || mode === 'realtime') {
    return mode;
  }

  throw new Error(
    `Unsupported VITE_EDITOR_TRANSPORT "${mode}". Expected "polling" or "realtime".`,
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
 * Reads a Vite boolean environment variable.
 *
 * @param key - Environment variable key.
 * @param fallback - Value used when the key is missing.
 * @returns Parsed boolean value.
 */
function readEnvBoolean(key: string, fallback: boolean): boolean {
  const value = import.meta.env[key];

  if (value === 'true' || value === '1') {
    return true;
  }

  if (value === 'false' || value === '0') {
    return false;
  }

  return fallback;
}

/** Runtime environment configuration for local development and deployed builds. */
export const env: EnvConfig = {
  apiMode: parseApiMode(import.meta.env.VITE_API_MODE),
  appName: readEnvValue('VITE_APP_NAME', 'Frontend New'),
  collaborationUrl: readEnvValue('VITE_COLLABORATION_URL', 'ws://localhost:4100'),
  editorTransport: parseEditorTransportMode(import.meta.env.VITE_EDITOR_TRANSPORT),
  enableRealtimeCollaboration: readEnvBoolean('VITE_ENABLE_REALTIME_COLLABORATION', false),
  graphqlApiUrl: readEnvValue('VITE_GRAPHQL_API_URL', 'http://localhost:4000/graphql'),
  restApiUrl: readEnvValue('VITE_REST_API_URL', 'http://localhost:4000'),
};
