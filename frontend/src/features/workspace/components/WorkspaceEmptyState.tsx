import { FilePlus2, FolderPlus } from 'lucide-react';

import { Button, Card } from '../../../shared/components';
import type { WorkspaceFilter } from '../types/workspace.types';

/** Props for the workspace empty state. */
export interface WorkspaceEmptyStateProps {
  /** Current search query. */
  searchQuery: string;
  /** Active sidebar filter. */
  activeFilter: WorkspaceFilter;
  /** Opens the create-folder dialog. */
  onCreateFolder: () => void;
  /** Opens the create-document dialog. */
  onCreateDocument: () => void;
}

/** Renders a focused empty state for empty folders and no-result searches. */
export function WorkspaceEmptyState({
  activeFilter,
  onCreateDocument,
  onCreateFolder,
  searchQuery,
}: WorkspaceEmptyStateProps): JSX.Element {
  const hasQuery = searchQuery.trim().length > 0;
  const title = hasQuery ? 'No matches found' : getEmptyTitle(activeFilter);
  const description = hasQuery
    ? 'Try a different name, owner, or sharing filter.'
    : 'Create a folder or document to start organizing your workspace.';

  return (
    <Card className="border-dashed">
      <Card.Content className="grid place-items-center gap-4 px-4 py-14 text-center">
        <div className="grid h-12 w-12 place-items-center rounded-lg bg-slate-100 text-slate-500">
          <FolderPlus className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <h2 className="m-0 text-lg font-semibold text-slate-950">{title}</h2>
          <p className="m-0 mt-2 max-w-md text-sm leading-6 text-slate-600">{description}</p>
        </div>
        {!hasQuery ? (
          <div className="flex flex-wrap justify-center gap-2">
            <Button onClick={onCreateFolder} variant="secondary">
              <FolderPlus className="h-4 w-4" aria-hidden="true" />
              Folder
            </Button>
            <Button onClick={onCreateDocument}>
              <FilePlus2 className="h-4 w-4" aria-hidden="true" />
              Document
            </Button>
          </div>
        ) : null}
      </Card.Content>
    </Card>
  );
}

/**
 * Gets the empty-state title for a sidebar filter.
 *
 * @param filter - Active workspace filter.
 * @returns Empty state title.
 */
function getEmptyTitle(filter: WorkspaceFilter): string {
  if (filter === 'private') {
    return 'No private items here';
  }

  if (filter === 'shared-by-me') {
    return 'Nothing shared by you here';
  }

  if (filter === 'shared-with-me') {
    return 'Nothing shared with you here';
  }

  return 'This folder is empty';
}
