import type { ReactNode } from 'react';
import type { Editor } from '@tiptap/react';
import { ArrowLeft } from 'lucide-react';

import { Button } from '../../../shared/components';
import { A4Page } from './A4Page';
import { CollaborationStatus } from './CollaborationStatus';
import { EditorToolbar } from './EditorToolbar';
import { SaveStatus } from './SaveStatus';
import type {
  EditorAwarenessUser,
  EditorCollaborationStatus,
  EditorDocument,
  EditorSaveStatus,
} from '../types/editor.types';

/** Props for the document editor shell. */
export interface EditorShellProps {
  /** TipTap editor instance. */
  editor: Editor | null;
  /** Loaded document metadata. */
  document: EditorDocument;
  /** Whether the current user may edit. */
  canEdit: boolean;
  /** Save status. */
  saveStatus: EditorSaveStatus;
  /** Optional save error. */
  saveError: string | null;
  /** Collaboration status. */
  collaborationStatus: EditorCollaborationStatus;
  /** Active remote users. */
  collaborators: EditorAwarenessUser[];
  /** Manual save handler. */
  onSave: () => void;
  /** Editor content node. */
  children: ReactNode;
}

/** Provides the professional document-editor page chrome. */
export function EditorShell({
  canEdit,
  children,
  collaborationStatus,
  collaborators,
  document,
  editor,
  onSave,
  saveError,
  saveStatus,
}: EditorShellProps): JSX.Element {
  return (
    <section className="flex min-h-[calc(100vh-7rem)] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            aria-label="Back to workspace"
            iconOnly
            onClick={() => window.history.back()}
            size="sm"
            variant="ghost"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Button>
          <div className="min-w-0">
            <h1 className="m-0 truncate text-base font-semibold text-slate-950">
              {document.title}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-3">
              <SaveStatus error={saveError} status={saveStatus} />
              <CollaborationStatus
                readOnly={!canEdit}
                status={collaborationStatus}
                users={collaborators}
              />
            </div>
          </div>
        </div>
      </header>

      <EditorToolbar editor={editor} canEdit={canEdit} onSave={onSave} saveStatus={saveStatus} />

      <div className="flex-1 overflow-auto bg-slate-200 px-4 py-8">
        <div className="mx-auto w-max max-w-full">
          <A4Page>{children}</A4Page>
        </div>
      </div>
    </section>
  );
}
