import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";

import BulletList from "@tiptap/extension-bullet-list";
import Color from "@tiptap/extension-color";
import FontFamily from "@tiptap/extension-font-family";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import OrderedList from "@tiptap/extension-ordered-list";
import TextAlign from "@tiptap/extension-text-align";
import FontSize from "@tiptap/extension-text-style/font-size";
import { TextStyle } from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

import { useAuth } from "@/features/auth";
import { useDocumentsStore } from "@/features/documents";
import EditorArea from "../components/EditorArea";
import EditorTitleBar from "../components/EditorTitleBar";
import EditorToolbar from "../components/EditorToolbar";
import PresenceBar from "../components/PresenceBar";
import {
  RemoteCursorExtension,
  setRemoteCursors,
} from "../extensions/RemoteCursorExtension";
import { useDocumentSyncSession } from "../hooks/useDocumentSyncSession";
import { useEditorAutosave } from "../hooks/useEditorAutosave";
import { useSyncMetrics } from "../hooks/useSyncMetrics";
import { useEditorSessionStore } from "../store/editorSessionStore";
import type { SyncMode } from "../services/documentSync";

const emptyDocumentContent = { type: "doc", content: [] };

export default function EditorPage() {
  const { id } = useParams();
  const { token } = useAuth();
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
  const cursorSendTimerRef = useRef<number | null>(null);
  const appliedEditorSnapshotRef = useRef<string | null>(null);

  const currentDocument = useMemo(() => {
    if (!id) return undefined;
    return documents.find((doc) => doc.id === id);
  }, [documents, id]);

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

  const {
    applyDocumentEvent,
    connectionState,
    presenceUsers,
    remoteCursors,
    sendCursor,
  } = useDocumentSyncSession({
    documentId: id,
    token,
    syncMode,
    pollIntervalMs,
    localRevision,
    onRevisionChange: setLocalRevision,
    onTitleChange: handleRemoteTitleChange,
    onMetric: recordMetric,
  });

  const { hasPendingLocalChanges, scheduleSave } = useEditorAutosave({
    documentId: id,
    token,
    syncMode,
    localRevision,
    onRevisionChange: setLocalRevision,
    onConflictMessageChange: setConflictMessage,
    onDocumentEvent: applyDocumentEvent,
    onMetric: recordMetric,
    setIsSaving,
    markSaved,
  });

  useEffect(() => {
    titleRef.current = currentDocument?.title ?? "";

    if (currentDocument) {
      setLocalRevision(currentDocument.revision);
    }

    if (id && currentDocument) {
      startSession(id, currentDocument.title);
    }
  }, [currentDocument, id, startSession]);

  useEffect(() => {
    appliedEditorSnapshotRef.current = null;
  }, [id]);

  useEffect(() => {
    return () => {
      endSession();
    };
  }, [endSession]);

  useEffect(() => {
    if (!id || !token) return;
    void refreshDocument(id, token);
  }, [id, refreshDocument, token]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: false,
        orderedList: false,
      }),
      BulletList.configure({
        keepMarks: true,
        keepAttributes: false,
      }),
      OrderedList.configure({
        keepMarks: true,
        keepAttributes: false,
      }),
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      Image,
      Link.configure({
        openOnClick: false,
      }),
      Underline,
      FontFamily,
      FontSize,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      RemoteCursorExtension,
    ],
    content: "",
    onUpdate({ editor }) {
      scheduleSave(() => {
        return {
          title: titleRef.current,
          content: editor.getJSON(),
        };
      });
    },
    onSelectionUpdate({ editor }) {
      if (cursorSendTimerRef.current !== null) {
        return;
      }

      cursorSendTimerRef.current = window.setTimeout(() => {
        cursorSendTimerRef.current = null;
        sendCursor(editor.state.selection.anchor, editor.state.selection.head);
      }, 80);
    },
  });

  useEffect(() => {
    return () => {
      if (cursorSendTimerRef.current !== null) {
        window.clearTimeout(cursorSendTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setRemoteCursors(editor, remoteCursors);
  }, [editor, remoteCursors]);

  useEffect(() => {
    if (!currentDocument || !editor) return;
    if (hasPendingLocalChanges && editor.isFocused) return;

    const editorSnapshotKey = [
      currentDocument.id,
      currentDocument.revision,
      currentDocument.updatedAt,
    ].join(":");

    if (appliedEditorSnapshotRef.current === editorSnapshotKey) return;

    const currentJSON = currentDocument.content ?? emptyDocumentContent;
    editor.commands.setContent(currentJSON, {
      emitUpdate: false,
    });
    appliedEditorSnapshotRef.current = editorSnapshotKey;
  }, [currentDocument, editor, hasPendingLocalChanges]);

  const displayedTitle =
    sessionDocumentId === id ? titleDraft : currentDocument?.title ?? "";

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
        syncMode={syncMode}
        connectionState={connectionState}
        conflictMessage={conflictMessage}
        onTitleChange={(value) => {
          titleRef.current = value;
          setTitleDraft(value);

          const currentContent =
            editor?.getJSON() ??
            currentDocument?.content ??
            emptyDocumentContent;

          scheduleSave(() => {
            return {
              title: value,
              content: currentContent,
            };
          });
        }}
        onSyncModeChange={handleSyncModeChange}
        onExportMetrics={exportMetrics}
        onResetMetrics={() => resetMetrics(syncMode)}
      />

      <EditorToolbar editor={editor} />
      <EditorArea editor={editor} />
      <PresenceBar
        metrics={metrics}
        pollIntervalMs={pollIntervalMs}
        connectionState={connectionState}
        presenceUsers={presenceUsers}
        onPollIntervalChange={(intervalMs) => {
          setPollIntervalMs(Math.max(500, intervalMs || 500));
        }}
      />
    </div>
  );
}
