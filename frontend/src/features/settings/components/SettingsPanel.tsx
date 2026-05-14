import { getThemeLabel } from '../utils/settings.utils';
import type { UserSettings } from '../types/settings.types';

/** Props for the settings panel component. */
export interface SettingsPanelProps {
  /** Settings displayed by the panel. */
  settings: UserSettings;
}

/** Displays editable settings controls as a reusable panel. */
export function SettingsPanel({ settings }: SettingsPanelProps): JSX.Element {
  return (
    <section aria-label="Settings panel">
      <h2>Settings Panel</h2>
      <p>Theme: {getThemeLabel(settings)}</p>
      <label>
        <input checked={settings.emailNotifications} readOnly type="checkbox" />
        Email notifications
      </label>
    </section>
  );
}
