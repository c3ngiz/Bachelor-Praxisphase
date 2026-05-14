import type { ReactNode } from 'react';
import type { AuthUser } from '../../features/auth/types/auth.types';
import { APP_TITLE } from '../constants';
import { AppUserMenu } from './AppUserMenu';

/** Props for the authenticated application layout. */
export interface AppLayoutProps {
  /** Current authenticated user rendered in the avatar menu. */
  currentUser: AuthUser | null;
  /** Clears the current session when the user chooses logout. */
  onSignOut: () => Promise<void>;
  /** Page content for the active route. */
  children: ReactNode;
}

/** Provides the main application shell and navigation. */
export function AppLayout({ children, currentUser, onSignOut }: AppLayoutProps): JSX.Element {
  const pathname = window.location.pathname;
  const isWorkspaceRoute = pathname.startsWith('/workspace');

  return (
    <div className="app-shell">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
        <div className="mx-auto flex min-h-14 w-[min(1440px,calc(100%-2rem))] items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <span
              aria-hidden="true"
              className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-950 text-xs font-bold text-white"
            >
              CD
            </span>
            <span className="truncate text-sm font-semibold text-slate-950">{APP_TITLE}</span>
          </div>

          {currentUser ? <AppUserMenu onSignOut={onSignOut} user={currentUser} /> : null}
        </div>
      </header>
      <main className={isWorkspaceRoute ? 'app-main app-main--workspace' : 'app-main'}>
        {children}
      </main>
    </div>
  );
}
