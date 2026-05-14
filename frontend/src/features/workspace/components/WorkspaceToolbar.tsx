import { FilePlus2, FolderPlus, RefreshCw, Search } from 'lucide-react';

import { Button, Input } from '../../../shared/components';

/** Props for the workspace toolbar. */
export interface WorkspaceToolbarProps {
  /** Current search query. */
  searchQuery: string;
  /** Updates the search query. */
  onSearchChange: (value: string) => void;
  /** Opens the create-folder dialog. */
  onCreateFolder: () => void;
  /** Opens the create-document dialog. */
  onCreateDocument: () => void;
  /** Reloads the current folder. */
  onRefresh: () => void;
  /** Whether the folder listing is currently refreshing. */
  isRefreshing: boolean;
}

/** Renders search, refresh, and create controls for the workspace explorer. */
export function WorkspaceToolbar({
  isRefreshing,
  onCreateDocument,
  onCreateFolder,
  onRefresh,
  onSearchChange,
  searchQuery,
}: WorkspaceToolbarProps): JSX.Element {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <Input
          aria-label="Search workspace"
          name="workspace-search"
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search files, folders, or owners"
          startAdornment={<Search className="h-4 w-4" aria-hidden="true" />}
          value={searchQuery}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          aria-label="Refresh workspace"
          iconOnly
          loading={isRefreshing}
          onClick={onRefresh}
          variant="secondary"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
        </Button>
        <Button onClick={onCreateFolder} variant="secondary">
          <FolderPlus className="h-4 w-4" aria-hidden="true" />
          Folder
        </Button>
        <Button onClick={onCreateDocument}>
          <FilePlus2 className="h-4 w-4" aria-hidden="true" />
          Document
        </Button>
      </div>
    </div>
  );
}
