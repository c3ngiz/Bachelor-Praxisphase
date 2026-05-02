import { useCallback, useEffect, useRef, useState } from "react";
import {
  getDocumentConflict,
  type Document,
  type UpdateDocumentInput,
  useDocumentsStore,
} from "@/features/documents";
import {
  createDocumentUpdateEvent,
  type DocumentUpdateEvent,
  type SyncMetricsEvent,
  type SyncMode,
} from "../services/documentSync";

type PendingSnapshotFactory = () => Omit<UpdateDocumentInput, "expectedRevision">;

type UseEditorAutosaveInput = {
  documentId: string | undefined;
  token: string | null;
  syncMode: SyncMode;
  localRevision: number;
  onRevisionChange: (revision: number) => void;
  onConflictMessageChange: (message: string | null) => void;
  onDocumentEvent: (event: DocumentUpdateEvent) => void;
  onMetric: (event: SyncMetricsEvent) => void;
  setIsSaving: (value: boolean) => void;
  markSaved: (timestamp?: string) => void;
};

const AUTOSAVE_DEBOUNCE_MS = 750;

export function useEditorAutosave({
  documentId,
  token,
  syncMode,
  localRevision,
  onRevisionChange,
  onConflictMessageChange,
  onDocumentEvent,
  onMetric,
  setIsSaving,
  markSaved,
}: UseEditorAutosaveInput) {
  const updateDocument = useDocumentsStore((state) => state.updateDocument);
  const revisionRef = useRef(localRevision);
  const pendingSnapshotFactoryRef = useRef<PendingSnapshotFactory | null>(null);
  const isSavingRef = useRef(false);
  const debounceTimerRef = useRef<number | null>(null);
  const [hasPendingLocalChanges, setHasPendingLocalChanges] = useState(false);

  useEffect(() => {
    revisionRef.current = localRevision;
  }, [localRevision]);

  const clearDebounceTimer = useCallback(() => {
    if (debounceTimerRef.current !== null) {
      window.clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  }, []);

  const flushLatestSnapshot = useCallback(async () => {
    clearDebounceTimer();

    if (!documentId || !token || isSavingRef.current) {
      return;
    }

    const createSnapshot = pendingSnapshotFactoryRef.current;

    if (!createSnapshot) {
      setHasPendingLocalChanges(false);
      return;
    }

    pendingSnapshotFactoryRef.current = null;
    isSavingRef.current = true;
    const input = createSnapshot();
    const sentAt = new Date().toISOString();
    const expectedRevision = revisionRef.current;
    setIsSaving(true);
    onMetric({ type: "sent", mode: syncMode, sentAt });
    onMetric({ type: "request", mode: syncMode, timestamp: sentAt });

    try {
      const updatedDocument = await updateDocument(
        documentId,
        {
          ...input,
          expectedRevision,
        },
        token,
      );

      revisionRef.current = updatedDocument.revision;
      onRevisionChange(updatedDocument.revision);
      onConflictMessageChange(null);
      markSaved();
    } catch (error) {
      const conflict = getDocumentConflict(error);

      if (conflict) {
        pendingSnapshotFactoryRef.current = null;
        revisionRef.current = conflict.document.revision;
        onRevisionChange(conflict.document.revision);
        onConflictMessageChange(
          `Conflict: server revision ${conflict.actualRevision} replaced local revision ${conflict.expectedRevision}.`,
        );
        onMetric({
          type: "conflict",
          mode: syncMode,
          timestamp: new Date().toISOString(),
          expectedRevision: conflict.expectedRevision,
          actualRevision: conflict.actualRevision,
        });
        // MVP conflict policy: full-document replacement with server revision winning.
        onDocumentEvent(
          createDocumentUpdateEvent(conflict.document as Document, syncMode),
        );
        return;
      }

      console.error(error);
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);

      if (pendingSnapshotFactoryRef.current) {
        debounceTimerRef.current = window.setTimeout(() => {
          void flushLatestSnapshot();
        }, AUTOSAVE_DEBOUNCE_MS);
      } else {
        setHasPendingLocalChanges(false);
      }
    }
  }, [
    clearDebounceTimer,
    documentId,
    markSaved,
    onConflictMessageChange,
    onDocumentEvent,
    onMetric,
    onRevisionChange,
    setIsSaving,
    syncMode,
    token,
    updateDocument,
  ]);

  const scheduleSave = useCallback(
    (createSnapshot: PendingSnapshotFactory) => {
      if (!documentId || !token) {
        return;
      }

      pendingSnapshotFactoryRef.current = createSnapshot;
      setHasPendingLocalChanges(true);

      if (isSavingRef.current) {
        return;
      }

      clearDebounceTimer();
      debounceTimerRef.current = window.setTimeout(() => {
        void flushLatestSnapshot();
      }, AUTOSAVE_DEBOUNCE_MS);
    },
    [clearDebounceTimer, documentId, flushLatestSnapshot, token],
  );

  useEffect(() => {
    return () => {
      clearDebounceTimer();
    };
  }, [clearDebounceTimer]);

  return {
    hasPendingLocalChanges,
    scheduleSave,
  };
}
