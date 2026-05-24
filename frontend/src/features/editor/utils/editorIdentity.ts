/**
 * Picks a stable editor identity color from a small readable palette.
 *
 * @param value - User or client identifier used as the hash input.
 * @returns Hex color used for cursors and collaborator avatars.
 */
export function getEditorUserColor(value: string): string {
  const palette = ['#0f766e', '#7c3aed', '#b45309', '#0369a1', '#be123c', '#15803d'];
  const hash = Array.from(value).reduce((sum, character) => sum + character.charCodeAt(0), 0);

  return palette[hash % palette.length];
}

/**
 * Normalizes backend or legacy color values into a CodeMirror-ready hex color.
 *
 * @param value - Hex color or legacy Tailwind background class.
 * @param fallback - Color returned when the value is missing or unsupported.
 * @returns Normalized hex color.
 */
export function normalizeEditorColor(value: string | null | undefined, fallback: string): string {
  if (!value) {
    return fallback;
  }

  if (/^#[0-9a-f]{6}$/i.test(value)) {
    return value;
  }

  return tailwindBackgroundColorMap[value] ?? fallback;
}

/**
 * Builds initials for compact collaborator avatars.
 *
 * @param name - Display name to abbreviate.
 * @returns Up to two uppercase initials.
 */
export function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

const tailwindBackgroundColorMap: Record<string, string> = {
  'bg-blue-500': '#3b82f6',
  'bg-cyan-500': '#06b6d4',
  'bg-emerald-500': '#10b981',
  'bg-fuchsia-500': '#d946ef',
  'bg-indigo-500': '#6366f1',
  'bg-orange-500': '#f97316',
  'bg-pink-500': '#ec4899',
  'bg-purple-500': '#a855f7',
  'bg-rose-500': '#f43f5e',
  'bg-sky-500': '#0ea5e9',
  'bg-teal-500': '#14b8a6',
};
