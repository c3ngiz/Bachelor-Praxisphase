import { SignInPage, SignUpPage } from '../../features/auth';
import { EditorPage } from '../../features/editor';
import { ProfilePage } from '../../features/profile';
import { SettingsPage } from '../../features/settings';
import { WorkspacePage } from '../../features/workspace';

/** Supported application route paths. */
export type AppRoutePath =
  | '/sign-in'
  | '/sign-up'
  | '/workspace'
  | '/workspace/folder/:folderId'
  | '/workspace/document/:documentId'
  | '/profile'
  | '/settings';

/** Route match context passed to route components. */
export interface AppRouteContext {
  /** Matched browser pathname. */
  pathname: string;
  /** Dynamic route parameters parsed from the pathname. */
  params: Record<string, string>;
}

/** Route configuration entry used by the application router. */
export interface AppRoute {
  /** URL pathname for the route. */
  path: AppRoutePath;
  /** Human-readable navigation label. */
  label: string;
  /** Component rendered for the route. */
  Component: (context: AppRouteContext) => JSX.Element;
  /** Whether unauthenticated users should be redirected to sign in. */
  requiresAuth?: boolean;
  /** Whether the route should be shown in primary navigation. */
  showInNav?: boolean;
  /** Optional redirect target for legacy routes. */
  redirectTo?: AppRoutePath;
}

/** Centralized application route configuration. */
export const appRoutes: AppRoute[] = [
  { path: '/sign-in', label: 'Sign In', Component: SignInPage, showInNav: false },
  { path: '/sign-up', label: 'Sign Up', Component: SignUpPage, showInNav: false },
  { path: '/workspace', label: 'Workspace', Component: WorkspacePage, requiresAuth: true },
  {
    path: '/workspace/folder/:folderId',
    label: 'Workspace folder',
    Component: WorkspacePage,
    requiresAuth: true,
    showInNav: false,
  },
  {
    path: '/workspace/document/:documentId',
    label: 'Document editor',
    Component: EditorPage,
    requiresAuth: true,
    showInNav: false,
  },
  {
    path: '/profile',
    label: 'Profile',
    Component: ProfilePage,
    requiresAuth: true,
    showInNav: false,
  },
  {
    path: '/settings',
    label: 'Settings',
    Component: SettingsPage,
    requiresAuth: true,
    showInNav: false,
  },
];
