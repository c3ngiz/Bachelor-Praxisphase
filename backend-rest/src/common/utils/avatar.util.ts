const avatarColors = [
  'bg-emerald-500',
  'bg-sky-500',
  'bg-violet-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-cyan-500',
] as const;

/**
 * Builds display initials from a user name or email address.
 *
 * @param name - Preferred display name.
 * @param email - Fallback email address.
 * @returns One or two uppercase initials.
 */
export function getInitials(name: string, email: string): string {
  const source = name.trim().length > 0 ? name.trim() : email.trim();
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}

/**
 * Picks a deterministic avatar color token for users without a selected color.
 *
 * @param email - User email used as a stable hash source.
 * @returns Tailwind color token consumed by the frontend.
 */
export function getAvatarColor(email: string): string {
  const hash = [...email].reduce((total, character) => total + character.charCodeAt(0), 0);
  return avatarColors[hash % avatarColors.length] ?? avatarColors[0];
}
