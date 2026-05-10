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
  const pathname = window.location.pathname;
  const isWorkspaceRoute = pathname.startsWith('/workspace');

  return (
    <div className="app-shell">
      <nav className="app-nav" aria-label="Primary">
        {routes
          .filter((route) => route.showInNav !== false)
          .map((route) => {
            const isActive =
              pathname === route.path || (route.path === '/workspace' && isWorkspaceRoute);

            return (
              <a
                aria-current={isActive ? 'page' : undefined}
                className={isActive ? 'app-nav__link app-nav__link--active' : 'app-nav__link'}
                href={route.path}
                key={route.path}
              >
                {route.label}
              </a>
            );
          })}
      </nav>
      <main className={isWorkspaceRoute ? 'app-main app-main--workspace' : 'app-main'}>
        {children}
      </main>
    </div>
  );
}
