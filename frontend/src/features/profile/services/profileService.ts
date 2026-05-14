import type { UserProfile } from '../types/profile.types';

/** Service facade for profile data. */
export const profileService = {
  /** Returns a mocked user profile. */
  async getProfile(): Promise<UserProfile> {
    return {
      id: 'profile-1',
      name: 'Example User',
      bio: 'Profile stub ready for real data.',
    };
  },
};
