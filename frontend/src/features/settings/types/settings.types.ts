/** Editable application settings. */
export interface UserSettings {
  /** Whether email notifications are enabled. */
  emailNotifications: boolean;
  /** Preferred application theme. */
  theme: 'light' | 'dark' | 'system';
}
