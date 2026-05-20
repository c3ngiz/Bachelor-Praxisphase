/**
 * Stable text hashing for collaboration divergence checks.
 *
 * The backend uses the same FNV-1a over UTF-8 bytes algorithm and returns the
 * same `fnv1a32:<byteLength>:<hex>` shape. This is intentionally synchronous so
 * operation sends can include a cheap client hash without awaiting Web Crypto.
 */

const FNV1A_32_OFFSET = 2166136261;
const FNV1A_32_PRIME = 16777619;
const encoder = new TextEncoder();

/**
 * Computes a stable UTF-8 FNV-1a hash for plain-text content.
 *
 * @param content - Plain text to hash.
 * @returns Stable hash string compatible with the Python backend.
 */
export function stableTextHash(content: string): string {
  const bytes = encoder.encode(content);
  let value = FNV1A_32_OFFSET;

  for (const byte of bytes) {
    value ^= byte;
    value = Math.imul(value, FNV1A_32_PRIME);
  }

  return `fnv1a32:${bytes.length}:${(value >>> 0).toString(16).padStart(8, '0')}`;
}
