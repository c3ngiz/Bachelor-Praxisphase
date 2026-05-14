import type { JSONContent } from '@tiptap/core';

import type { EntityId, Timestamped } from '../../../shared/types';

export type { JSONContent };

/** Empty TipTap document used when the backend has no persisted content yet. */
export const emptyEditorContent: JSONContent = { content: [], type: 'doc' };

/** Document role vocabulary returned by the legacy document APIs. */
export type EditorDocumentRole = 'owner' | 'editor' | 'viewer' | null;

/** Save status shown around the editor toolbar. */
export type EditorSaveStatus = 'saved' | 'saving' | 'unsaved' | 'failed';

/** Collaboration transport state shown in the editor chrome. */
export type EditorCollaborationStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'synced'
  | 'disconnected'
  | 'failed';

/** User shown in collaboration presence and remote caret labels. */
export interface EditorAwarenessUser {
  /** Stable user identifier. */
  id: EntityId;
  /** Display name shown in presence and caret labels. */
  name: string;
  /** CSS color used for remote carets. */
  color: string;
  /** Current user's initials, when available. */
  initials?: string;
}

/** Collaborator entry attached to an editor document response. */
export interface EditorDocumentCollaborator {
  /** User identifier. */
  id: EntityId;
  /** Display name. */
  name: string;
  /** Initials used by avatar-style presence displays. */
  initials: string;
  /** Avatar or caret color token. */
  color: string;
  /** Document role. */
  role: Exclude<EditorDocumentRole, null>;
}

/** Normalized document content and permission data consumed by the editor. */
export interface EditorDocument extends Timestamped {
  /** Document identifier. */
  id: EntityId;
  /** Editable display title. */
  title: string;
  /** Latest JSON snapshot returned by REST or GraphQL. */
  content: JSONContent;
  /** Optimistic revision for fallback REST/GraphQL saves. */
  revision: number;
  /** Owner identifier. */
  ownerId: EntityId;
  /** Owner display name. */
  ownerName: string;
  /** Current user's document role. */
  currentUserRole: EditorDocumentRole;
  /** Whether the current user may edit content. */
  canEdit: boolean;
  /** Whether the current user may manage sharing. */
  canShare: boolean;
  /** Whether the current user may delete the document. */
  canDelete: boolean;
  /** Users directly attached to the document response. */
  collaborators: EditorDocumentCollaborator[];
  /** User id of the last editor. */
  lastEditedById: EntityId;
  /** Display name of the last editor. */
  lastEditedByName: string;
  /** ISO timestamp for the last content edit. */
  lastEditedAt: string;
}

/** Input for saving a document snapshot through REST or GraphQL fallback APIs. */
export interface UpdateEditorDocumentInput {
  /** Document identifier. */
  documentId: EntityId;
  /** Expected optimistic revision. */
  expectedRevision: number;
  /** Optional new document title. */
  title?: string;
  /** Optional TipTap JSON content snapshot. */
  content?: JSONContent;
}

/** Client implemented by REST and GraphQL editor API adapters. */
export interface EditorClient {
  /**
   * Loads document metadata, content snapshot, and permissions.
   *
   * @param documentId - Document identifier.
   * @returns Normalized editor document.
   */
  getDocument(documentId: EntityId): Promise<EditorDocument>;

  /**
   * Saves document content or title through a fallback non-collaborative API path.
   *
   * @param input - Update request.
   * @returns Updated normalized editor document.
   */
  updateDocument(input: UpdateEditorDocumentInput): Promise<EditorDocument>;
}

/** Formatting state consumed by toolbar controls. */
export interface EditorToolbarState {
  /** Whether bold is active at the current selection. */
  bold: boolean;
  /** Whether italic is active at the current selection. */
  italic: boolean;
  /** Whether underline is active at the current selection. */
  underline: boolean;
  /** Current paragraph or heading text alignment. */
  textAlign: 'left' | 'center' | 'right' | 'justify';
  /** Current font family mark. */
  fontFamily: string;
  /** Current font size mark. */
  fontSize: string;
  /** Whether a bullet list is active. */
  bulletList: boolean;
  /** Whether an ordered list is active. */
  orderedList: boolean;
  /** Active heading level, or null for paragraph/list content. */
  headingLevel: 1 | 2 | 3 | null;
  /** Current highlight color when known. */
  highlightColor: string;
}
