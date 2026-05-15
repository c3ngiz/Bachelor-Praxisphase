import { Badge } from '../../../shared/components';
import type { DocumentItem } from '../../workspace/types/workspace.types';

/** Props for the editor document header. */
export interface DocumentHeaderProps {
  /** Whether the current user may edit title/content. */
  canWrite: boolean;
  /** Loaded workspace document metadata. */
  document: DocumentItem | null;
  /** Whether the initial document load is pending. */
  isLoading: boolean;
  /** Handles title input changes. */
  onTitleChange: (title: string) => void;
  /** Current document title. */
  title: string;
}

/**
 * Renders document identity and editable title controls in the sidebar.
 *
 * @param props - Document header props.
 * @returns Sidebar document header.
 */
export function DocumentHeader({
  canWrite,
  document,
  isLoading,
  onTitleChange,
  title,
}: DocumentHeaderProps): JSX.Element {
  return (
    <div className="grid gap-2">
      <div>
        <p className="m-0 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Document
        </p>
        <label className="sr-only" htmlFor="document-title">
          Document title
        </label>
        <input
          aria-label="Document title"
          className="editor-title-input"
          disabled={!canWrite || isLoading}
          id="document-title"
          onChange={(event) => onTitleChange(event.target.value)}
          placeholder={isLoading ? 'Loading document...' : 'Untitled document'}
          value={title}
        />
      </div>
      <div className="grid gap-1 text-xs text-slate-500">
        <p className="m-0 truncate">
          {document?.owner.name ? `Owner: ${document.owner.name}` : 'Owner unavailable'}
        </p>
        {!canWrite && !isLoading ? (
          <Badge className="w-fit" variant="default">
            Read only
          </Badge>
        ) : null}
      </div>
    </div>
  );
}
