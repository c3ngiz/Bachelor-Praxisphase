import type { UserProfile } from '../types/profile.types';

/** Creates initials from a profile display name. */
export function getProfileInitials(profile: UserProfile): string {
  return profile.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}
