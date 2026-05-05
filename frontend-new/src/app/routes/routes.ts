import { LoginPage } from '../../features/auth';
import { DashboardPage } from '../../features/dashboard';
import { DocumentsPage } from '../../features/documents';
import { EditorPage } from '../../features/editor';
import { ProfilePage } from '../../features/profile';
import { SettingsPage } from '../../features/settings';

/** Supported application route paths. */
export type AppRoutePath = '/login' | '/dashboard' | '/documents' | '/editor' | '/profile' | '/settings';

/** Route configuration entry used by the application router. */
export interface AppRoute {
  /** URL pathname for the route. */
  path: AppRoutePath;
  /** Human-readable navigation label. */
  label: string;
  /** Component rendered for the route. */
  Component: () => JSX.Element;
}

/** Centralized application route configuration. */
export const appRoutes: AppRoute[] = [
  { path: '/login', label: 'Login', Component: LoginPage },
  { path: '/dashboard', label: 'Dashboard', Component: DashboardPage },
  { path: '/documents', label: 'Documents', Component: DocumentsPage },
  { path: '/editor', label: 'Editor', Component: EditorPage },
  { path: '/profile', label: 'Profile', Component: ProfilePage },
  { path: '/settings', label: 'Settings', Component: SettingsPage },
];
