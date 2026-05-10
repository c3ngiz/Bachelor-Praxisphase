import type { ReactNode } from 'react';

/** Props for the workspace shell layout. */
export interface WorkspaceShellProps {
  /** Sidebar navigation content. */
  sidebar: ReactNode;
  /** Toolbar content above the explorer. */
  toolbar: ReactNode;
  /** Breadcrumb navigation content. */
  breadcrumbs: ReactNode;
  /** Main explorer content. */
  children: ReactNode;
}

/** Provides the responsive workspace layout used by the dashboard page. */
export function WorkspaceShell({
  breadcrumbs,
  children,
  sidebar,
  toolbar,
}: WorkspaceShellProps): JSX.Element {
  return (
    <section className="workspace-page" aria-label="Workspace">
      <div className="workspace-page__sidebar">{sidebar}</div>
      <div className="min-w-0 flex-1">
        <div className="mb-4 grid gap-3">
          {toolbar}
          {breadcrumbs}
        </div>
        {children}
      </div>
    </section>
  );
}
