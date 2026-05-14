import { useState } from 'react';
import type { UserSettings } from '../types/settings.types';

/** Return value for settings state. */
export interface UseSettingsResult {
  /** Current local settings value. */
  settings: UserSettings;
  /** Updates local settings state. */
  setSettings: (settings: UserSettings) => void;
}

/** Provides local settings state for settings screens. */
export function useSettings(): UseSettingsResult {
  const [settings, setSettings] = useState<UserSettings>({
    emailNotifications: true,
    theme: 'system',
  });

  return { settings, setSettings };
}
