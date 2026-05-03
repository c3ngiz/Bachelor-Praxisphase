import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";

import { useAuth } from "@/features/auth";
import { useDocumentsStore } from "@/features/documents";
import EditorArea from "../components/EditorArea";
import EditorTitleBar from "../components/EditorTitleBar";
import EditorToolbar from "../components/EditorToolbar";
import PresenceBar from "../components/PresenceBar";
import { useCollaborationSession } from "../hooks/useCollaborationSession";
import { useDocumentEditor } from "../hooks/useDocumentEditor";
import { useDocumentSyncSession } from "../hooks/useDocumentSyncSession";
import { useEditorAutosave } from "../hooks/useEditorAutosave";
import { useSyncMetrics } from "../hooks/useSyncMetrics";
import type { SyncMode } from "../services/documentSync";
import { useEditorSessionStore } from "../store/editorSessionStore";

const emptyDocumentContent = { type: "doc", content: [] };

export default function EditorPage() {
  const { id } = useParams();
  const { token, user } = useAuth();
  const { documents, refreshDocument } = useDocumentsStore();

  const sessionDocumentId = useEditorSessionStore((s) => s.documentId);
  const titleDraft = useEditorSessionStore((s) => s.titleDraft);
  const isSaving = useEditorSessionStore((s) => s.isSaving);
  const lastSavedAt = useEditorSessionStore((s) => s.lastSavedAt);
  const startSession = useEditorSessionStore((s) => s.startSession);
  const setTitleDraft = useEditorSessionStore((s) => s.setTitleDraft);
  const setIsSaving = useEditorSessionStore((s) => s.setIsSaving);
  const markSaved = useEditorSessionStore((s) => s.markSaved);
  const endSession = useEditorSessionStore((s) => s.endSession);

  const [syncMode, setSyncMode] = useState<SyncMode>("polling");
  const [pollIntervalMs, setPollIntervalMs] = useState(2000);
  const [conflictMessage, setConflictMessage] = useState<string | null>(null);
  const [localRevision, setLocalRevision] = useState(1);
  const titleRef = useRef("");

  const currentDocument = useMemo(() => {
    if (!id) return undefined;
    return documents.find((doc) => doc.id === id);
  }, [documents, id]);
  const canEditCurrentDocument = currentDocument?.canEdit ?? false;

  const {
    metrics,
    recordMetric,
    recordModeSwitch,
    resetMetrics,
    exportMetrics,
  } = useSyncMetrics(syncMode, id ?? null);

  const handleRemoteTitleChange = useCallback((title: string) => {
    titleRef.current = title;
  }, []);

  const pollingSession = useDocumentSyncSession({
    documentId: syncMode === "polling" ? id : undefined,
    token,
    syncMode,
    pollIntervalMs,
    localRevision,
    onRevisionChange: setLocalRevision,
    onTitleChange: handleRemoteTitleChange,
    onMetric: recordMetric,
  });

  const collaborationSession = useCollaborationSession({
    documentId: id,
    token,
    user,
    enabled: syncMode === "collaboration",
  });
  const collaborationEditorUser = useMemo(() => {
    if (!collaborationSession.collaborationUser) {
      return null;
    }

    return {
      name: collaborationSession.collaborationUser.name,
      color: collaborationSession.collaborationUser.color,
    };
  }, [collaborationSession.collaborationUser]);

  const { hasPendingLocalChanges, scheduleSave } = useEditorAutosave({
    documentId: id,
    token,
    syncMode,
    localRevision,
    onRevisionChange: setLocalRevision,
    onConflictMessageChange: setConflictMessage,
    onDocumentEvent: pollingSession.applyDocumentEvent,
    onMetric: recordMetric,
    setIsSaving,
    markSaved,
  });

  const editor = useDocumentEditor({
    currentDocument,
    hasPendingLocalChanges,
    scheduleSave,
    titleRef,
    syncMode,
    canEdit: canEditCurrentDocument,
    collaboration: {
      document: collaborationSession.document,
      provider: collaborationSession.provider,
      user: collaborationEditorUser,
      markTyping: collaborationSession.markTyping,
    },
  });

  useEffect(() => {
    titleRef.current = currentDocument?.title ?? "";

    if (currentDocument) {
      queueMicrotask(() => {
        setLocalRevision(currentDocument.revision);
      });
    }

    if (id && currentDocument) {
      startSession(id, currentDocument.title);
    }
  }, [currentDocument, id, startSession]);

  useEffect(() => {
    return () => {
      endSession();
    };
  }, [endSession]);

  useEffect(() => {
    if (!id || !token) return;
    void refreshDocument(id, token);
  }, [id, refreshDocument, token]);

  const displayedTitle =
    sessionDocumentId === id ? titleDraft : currentDocument?.title ?? "";

  const connectionState =
    syncMode === "collaboration"
      ? collaborationSession.connectionState
      : pollingSession.connectionState;
  const presenceUsers =
    syncMode === "collaboration"
      ? collaborationSession.presenceUsers
      : pollingSession.presenceUsers;

  const handleSyncModeChange = useCallback(
    (nextMode: SyncMode) => {
      if (nextMode === syncMode) {
        return;
      }

      setSyncMode(nextMode);
      setConflictMessage(null);
      recordModeSwitch(nextMode);
    },
    [recordModeSwitch, syncMode],
  );

  return (
    <div className="flex h-screen flex-col bg-(--bg)">
      <EditorTitleBar
        title={displayedTitle}
        isSaving={isSaving}
        lastSavedAt={lastSavedAt}
        revision={currentDocument?.revision}
        canEdit={canEditCurrentDocument}
        syncMode={syncMode}
        connectionState={connectionState}
        conflictMessage={conflictMessage}
        onTitleChange={(value) => {
          if (!canEditCurrentDocument) return;

          titleRef.current = value;
          setTitleDraft(value);

          scheduleSave(() => {
            if (syncMode === "collaboration") {
              return { title: value };
            }

            return {
              title: value,
              content:
                editor?.getJSON() ??
                currentDocument?.content ??
                emptyDocumentContent,
            };
          });
        }}
        onSyncModeChange={handleSyncModeChange}
        onExportMetrics={exportMetrics}
        onResetMetrics={() => resetMetrics(syncMode)}
      />

      <EditorToolbar editor={editor} canEdit={canEditCurrentDocument} />
      <EditorArea editor={editor} />
      <PresenceBar
        metrics={metrics}
        pollIntervalMs={pollIntervalMs}
        syncMode={syncMode}
        connectionState={connectionState}
        presenceUsers={presenceUsers}
        onPollIntervalChange={(intervalMs) => {
          setPollIntervalMs(Math.max(500, intervalMs || 500));
        }}
      />
    </div>
  );
}
