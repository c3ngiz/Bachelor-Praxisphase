import { useMemo } from 'react';
import type { UserProfile } from '../types/profile.types';

/** Return value for profile state. */
export interface UseProfileResult {
  /** Mocked current user profile. */
  profile: UserProfile;
}

/** Provides profile state for profile screens. */
export function useProfile(): UseProfileResult {
  const profile = useMemo<UserProfile>(
    () => ({
      id: 'profile-1',
      name: 'Example User',
      bio: 'Profile stub ready for real data.',
    }),
    [],
  );

  return { profile };
}
