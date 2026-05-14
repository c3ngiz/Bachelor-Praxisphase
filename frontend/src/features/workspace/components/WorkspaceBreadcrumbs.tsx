import { ChevronRight, Home } from 'lucide-react';

import { getWorkspaceFolderPath } from '../utils/workspaceFormatting';
import type { WorkspaceBreadcrumb } from '../types/workspace.types';

/** Props for workspace breadcrumb navigation. */
export interface WorkspaceBreadcrumbsProps {
  /** Current folder breadcrumb path. */
  breadcrumbs: WorkspaceBreadcrumb[];
}

/** Renders folder path navigation for the workspace explorer. */
export function WorkspaceBreadcrumbs({ breadcrumbs }: WorkspaceBreadcrumbsProps): JSX.Element {
  return (
    <nav
      aria-label="Folder path"
      className="flex min-w-0 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600"
    >
      {breadcrumbs.map((breadcrumb, index) => {
        const isLast = index === breadcrumbs.length - 1;

        return (
          <span
            className="inline-flex min-w-0 items-center gap-1"
            key={`${breadcrumb.id ?? 'root'}-${index}`}
          >
            {index > 0 ? (
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
            ) : null}
            {isLast ? (
              <span className="inline-flex min-w-0 items-center gap-1 font-medium text-slate-950">
                {index === 0 ? <Home className="h-4 w-4 shrink-0" aria-hidden="true" /> : null}
                <span className="truncate">{breadcrumb.name}</span>
              </span>
            ) : (
              <a
                className="inline-flex min-w-0 items-center gap-1 rounded-md px-1.5 py-1 hover:bg-slate-100 hover:text-slate-950"
                href={getWorkspaceFolderPath(breadcrumb.id)}
              >
                {index === 0 ? <Home className="h-4 w-4 shrink-0" aria-hidden="true" /> : null}
                <span className="truncate">{breadcrumb.name}</span>
              </a>
            )}
          </span>
        );
      })}
    </nav>
  );
}
