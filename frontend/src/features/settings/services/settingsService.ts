import type { UserSettings } from '../types/settings.types';

/** Service facade for user settings. */
export const settingsService = {
  /** Returns mocked user settings. */
  async getSettings(): Promise<UserSettings> {
    return {
      emailNotifications: true,
      theme: 'system',
    };
  },
};
