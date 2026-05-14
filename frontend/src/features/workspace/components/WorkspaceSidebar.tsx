import { FileText, FolderClosed, Share2, UserRoundCheck } from 'lucide-react';

import { Badge } from '../../../shared/components';
import type { WorkspaceFilter } from '../types/workspace.types';

/** Props for the workspace sidebar filter navigation. */
export interface WorkspaceSidebarProps {
  /** Active sidebar filter. */
  activeFilter: WorkspaceFilter;
  /** Item counts keyed by filter. */
  counts: Record<WorkspaceFilter, number>;
  /** Handles filter selection. */
  onFilterChange: (filter: WorkspaceFilter) => void;
}

const filters: Array<{
  icon: typeof FolderClosed;
  label: string;
  value: WorkspaceFilter;
}> = [
  { icon: FolderClosed, label: 'All items', value: 'all' },
  { icon: UserRoundCheck, label: 'Private', value: 'private' },
  { icon: Share2, label: 'Shared by me', value: 'shared-by-me' },
  { icon: FileText, label: 'Shared with me', value: 'shared-with-me' },
];

/** Renders workspace filter navigation and local item counts. */
export function WorkspaceSidebar({
  activeFilter,
  counts,
  onFilterChange,
}: WorkspaceSidebarProps): JSX.Element {
  return (
    <aside
      className="rounded-lg border border-slate-200 bg-white p-3"
      aria-label="Workspace sections"
    >
      <div className="px-2 pb-3">
        <p className="m-0 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Workspace
        </p>
        <h1 className="m-0 mt-1 text-lg font-semibold text-slate-950">My files</h1>
      </div>
      <nav className="grid gap-1" aria-label="Workspace filters">
        {filters.map((filter) => {
          const Icon = filter.icon;
          const isActive = activeFilter === filter.value;

          return (
            <button
              aria-current={isActive ? 'page' : undefined}
              className={[
                'flex w-full items-center justify-between gap-3 rounded-md px-2 py-2 text-left text-sm transition-colors',
                isActive
                  ? 'bg-slate-950 text-white'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950',
              ].join(' ')}
              key={filter.value}
              onClick={() => onFilterChange(filter.value)}
              type="button"
            >
              <span className="inline-flex min-w-0 items-center gap-2">
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="truncate">{filter.label}</span>
              </span>
              <Badge
                className={isActive ? 'border-white/20 bg-white/15 text-white' : undefined}
                variant="default"
              >
                {counts[filter.value]}
              </Badge>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
