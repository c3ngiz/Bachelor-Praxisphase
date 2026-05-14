import { SettingsPanel } from '../components/SettingsPanel';
import { useSettings } from '../hooks/useSettings';

/** Settings page for user preferences. */
export function SettingsPage(): JSX.Element {
  const { settings } = useSettings();

  return (
    <section>
      <h1>Settings Page</h1>
      <SettingsPanel settings={settings} />
    </section>
  );
}
