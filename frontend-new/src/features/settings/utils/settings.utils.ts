import type { UserSettings } from '../types/settings.types';

/** Returns a readable label for the selected settings theme. */
export function getThemeLabel(settings: UserSettings): string {
  return settings.theme[0].toUpperCase() + settings.theme.slice(1);
}
