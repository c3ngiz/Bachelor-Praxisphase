import type { EditorAwarenessUser } from '../types/editor.types';
import type { AuthUser } from '../../auth/types/auth.types';

const avatarColorMap: Record<string, string> = {
  'bg-amber-500': '#f59e0b',
  'bg-blue-500': '#3b82f6',
  'bg-cyan-500': '#06b6d4',
  'bg-emerald-500': '#10b981',
  'bg-fuchsia-500': '#d946ef',
  'bg-indigo-500': '#6366f1',
  'bg-lime-500': '#84cc16',
  'bg-pink-500': '#ec4899',
  'bg-purple-500': '#a855f7',
  'bg-red-500': '#ef4444',
  'bg-rose-500': '#f43f5e',
  'bg-sky-500': '#0ea5e9',
  'bg-slate-500': '#64748b',
  'bg-teal-500': '#14b8a6',
  'bg-violet-500': '#8b5cf6',
};

const fallbackCaretColors = [
  '#0ea5e9',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#14b8a6',
  '#ec4899',
];

/**
 * Converts backend avatar color tokens into CSS colors usable by collaboration carets.
 *
 * @param value - Tailwind class token or CSS color.
 * @param seed - Stable seed used for fallback colors.
 * @returns CSS color string.
 */
export function toCaretColor(value: string | undefined, seed: string): string {
  if (value?.startsWith('#') || value?.startsWith('rgb')) {
    return value;
  }

  if (value && avatarColorMap[value]) {
    return avatarColorMap[value];
  }

  const colorIndex = Array.from(seed).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return fallbackCaretColors[colorIndex % fallbackCaretColors.length];
}

/**
 * Creates the awareness payload shared with Hocuspocus and TipTap carets.
 *
 * @param user - Authenticated frontend user.
 * @returns Awareness user payload.
 */
export function toEditorAwarenessUser(user: AuthUser): EditorAwarenessUser {
  return {
    color: toCaretColor(user.avatarColor, user.id),
    id: user.id,
    initials: user.initials,
    name: user.name,
  };
}

/**
 * Formats collaborator names for compact status text.
 *
 * @param users - Active awareness users.
 * @returns Readable collaborator label.
 */
export function formatActiveCollaborators(users: EditorAwarenessUser[]): string {
  if (users.length === 0) {
    return 'Only you';
  }

  if (users.length === 1) {
    return users[0].name;
  }

  return `${users.length} collaborators`;
}
