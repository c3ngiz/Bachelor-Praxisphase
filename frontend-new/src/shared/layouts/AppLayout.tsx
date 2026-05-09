import type { ReactNode } from 'react';
import type { AppRoute } from '../../app/routes';

/** Props for the authenticated application layout. */
export interface AppLayoutProps {
  /** Routes rendered as primary navigation links. */
  routes: AppRoute[];
  /** Page content for the active route. */
  children: ReactNode;
}

/** Provides the main application shell and navigation. */
export function AppLayout({ routes, children }: AppLayoutProps): JSX.Element {
  return (
    <div className="app-shell">
      <nav className="app-nav" aria-label="Primary">
        {routes
          .filter((route) => route.path !== '/sign-in' && route.path !== '/sign-up')
          .map((route) => (
            <a href={route.path} key={route.path}>
              {route.label}
            </a>
          ))}
      </nav>
      <main className="app-main">{children}</main>
    </div>
  );
}
