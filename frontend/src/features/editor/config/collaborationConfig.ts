const DEFAULT_COLLABORATION_WS_URL = "ws://localhost:4100";

function getImportMetaEnv(): Record<string, string | undefined> {
  return typeof import.meta !== "undefined"
    ? (import.meta.env as Record<string, string | undefined>)
    : {};
}

export const COLLABORATION_WS_URL =
  getImportMetaEnv().VITE_COLLABORATION_WS_URL || DEFAULT_COLLABORATION_WS_URL;
