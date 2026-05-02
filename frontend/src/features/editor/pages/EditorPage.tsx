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
import {
  getConflictDocument,
  normalizeDocument,
  type Document,
  type UpdateDocumentInput,
  useDocumentsStore,
} from "@/features/documents";
import EditorArea from "../components/EditorArea";
import EditorTitleBar from "../components/EditorTitleBar";
import EditorToolbar from "../components/EditorToolbar";
import PresenceBar from "../components/PresenceBar";
import {
  createGraphqlSubscriptionClient,
  createRestPollingClient,
  createWebSocketClient,
  type SyncMetricsEvent,
  type SyncMode,
} from "../services/documentSync";
import { useEditorSessionStore } from "../store/editorSessionStore";
import type { EditorSyncMetrics } from "../types";

const emptyDocumentContent = { type: "doc", content: [] };

function upsertDocument(documents: Document[], incoming: Document): Document[] {
  const normalizedDocument = normalizeDocument(incoming);
  const index = documents.findIndex((doc) => doc.id === normalizedDocument.id);

  if (index === -1) {
    return [normalizedDocument, ...documents];
  }

  const nextDocuments = [...documents];
  nextDocuments[index] = normalizedDocument;
  return nextDocuments;
}

function calculateLatency(sentAt?: string): number | null {
  if (!sentAt) {
    return null;
  }

  const sentAtMs = new Date(sentAt).getTime();

  if (Number.isNaN(sentAtMs)) {
    return null;
  }

  return Date.now() - sentAtMs;
}

function createInitialMetrics(): EditorSyncMetrics {
  return {
    requests: 0,
    messagesReceived: 0,
    writesSent: 0,
    conflicts: 0,
    lastLatencyMs: null,
    samples: [],
  };
}

export default function EditorPage() {
  const { id } = useParams();
  const { token } = useAuth();
  const { documents, updateDocument, refreshDocument } = useDocumentsStore();

  const sessionDocumentId = useEditorSessionStore((s) => s.documentId);
  const titleDraft = useEditorSessionStore((s) => s.titleDraft);
  const isSaving = useEditorSessionStore((s) => s.isSaving);
  const lastSavedAt = useEditorSessionStore((s) => s.lastSavedAt);
  const startSession = useEditorSessionStore((s) => s.startSession);
  const setTitleDraft = useEditorSessionStore((s) => s.setTitleDraft);
  const setIsSaving = useEditorSessionStore((s) => s.setIsSaving);
  const markSaved = useEditorSessionStore((s) => s.markSaved);
  const endSession = useEditorSessionStore((s) => s.endSession);

  const [syncMode, setSyncMode] = useState<SyncMode>("websocket");
  const [pollIntervalMs, setPollIntervalMs] = useState(2000);
  const [conflictMessage, setConflictMessage] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<EditorSyncMetrics>(createInitialMetrics);

  const titleRef = useRef("");
  const idRef = useRef(id);
  const revisionRef = useRef(1);
  const saveChainRef = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    idRef.current = id;
  }, [id]);

  const currentDocument = useMemo(() => {
    if (!id) return undefined;
    return documents.find((doc) => doc.id === id);
  }, [documents, id]);

  useEffect(() => {
    revisionRef.current = currentDocument?.revision ?? revisionRef.current;
  }, [currentDocument?.revision]);

  const recordMetric = useCallback((event: SyncMetricsEvent) => {
    setMetrics((currentMetrics) => {
      const latencyMs =
        event.type === "received" ? calculateLatency(event.sentAt) : undefined;
      const timestamp =
        event.type === "sent"
          ? event.sentAt
          : event.type === "received"
            ? event.receivedAt
            : event.timestamp;

      return {
        requests:
          currentMetrics.requests + (event.type === "request" ? 1 : 0),
        messagesReceived:
          currentMetrics.messagesReceived + (event.type === "received" ? 1 : 0),
        writesSent:
          currentMetrics.writesSent + (event.type === "sent" ? 1 : 0),
        conflicts:
          currentMetrics.conflicts + (event.type === "conflict" ? 1 : 0),
        lastLatencyMs:
          latencyMs === undefined || latencyMs === null
            ? currentMetrics.lastLatencyMs
            : latencyMs,
        samples: [
          ...currentMetrics.samples,
          {
            mode: event.mode,
            type: event.type,
            timestamp,
            latencyMs: latencyMs ?? undefined,
          },
        ].slice(-500),
      };
    });
  }, []);

  const applyIncomingDocument = useCallback((incomingDocument: Document) => {
    const normalizedDocument = normalizeDocument(incomingDocument);

    if (normalizedDocument.revision < revisionRef.current) {
      return;
    }

    revisionRef.current = normalizedDocument.revision;
    titleRef.current = normalizedDocument.title;
    useDocumentsStore.setState((state) => ({
      documents: upsertDocument(state.documents, normalizedDocument),
    }));
  }, []);

  const saveDocument = useCallback(
    (input: Omit<UpdateDocumentInput, "expectedRevision">) => {
      if (!idRef.current || !token) {
        return;
      }

      saveChainRef.current = saveChainRef.current
        .catch(() => undefined)
        .then(async () => {
          const sentAt = new Date().toISOString();
          setIsSaving(true);
          recordMetric({ type: "sent", mode: syncMode, sentAt });
          recordMetric({ type: "request", mode: syncMode, timestamp: sentAt });

          try {
            const updatedDocument = await updateDocument(
              idRef.current!,
              {
                ...input,
                expectedRevision: revisionRef.current,
              },
              token,
            );

            revisionRef.current = updatedDocument.revision;
            setConflictMessage(null);
            markSaved();
          } catch (error) {
            const conflictDocument = getConflictDocument(error);

            if (conflictDocument) {
              revisionRef.current = conflictDocument.revision;
              titleRef.current = conflictDocument.title;
              setConflictMessage("Conflict resolved with server revision.");
              recordMetric({
                type: "conflict",
                mode: syncMode,
                timestamp: new Date().toISOString(),
              });
              applyIncomingDocument(conflictDocument);
              return;
            }

            console.error(error);
          } finally {
            setIsSaving(false);
          }
        });
    },
    [
      applyIncomingDocument,
      markSaved,
      recordMetric,
      setIsSaving,
      syncMode,
      token,
      updateDocument,
    ],
  );

  useEffect(() => {
    titleRef.current = currentDocument?.title ?? "";

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
    if (!id || !token || currentDocument) return;
    void refreshDocument(id, token);
  }, [currentDocument, id, refreshDocument, token]);

  useEffect(() => {
    if (!id || !token) {
      return;
    }

    const options = {
      documentId: id,
      token,
      pollIntervalMs,
      getLocalRevision: () => revisionRef.current,
      onDocument: applyIncomingDocument,
      onMetric: recordMetric,
    };
    const client =
      syncMode === "rest-polling"
        ? createRestPollingClient(options)
        : syncMode === "graphql-subscription"
          ? createGraphqlSubscriptionClient(options)
          : createWebSocketClient(options);

    client.connect();

    return () => {
      client.disconnect();
    };
  }, [applyIncomingDocument, id, pollIntervalMs, recordMetric, syncMode, token]);

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
    ],
    content: "",
    onUpdate({ editor }) {
      saveDocument({
        title: titleRef.current,
        content: editor.getJSON(),
      });
    },
  });

  useEffect(() => {
    if (!currentDocument || !editor) return;

    const currentJSON = currentDocument.content ?? emptyDocumentContent;
    const editorJSON = editor.getJSON();

    if (JSON.stringify(editorJSON) !== JSON.stringify(currentJSON)) {
      editor.commands.setContent(currentJSON, {
        emitUpdate: false,
      });
    }
  }, [currentDocument, editor]);

  const displayedTitle =
    sessionDocumentId === id ? titleDraft : currentDocument?.title ?? "";

  return (
    <div className="flex h-screen flex-col bg-(--bg)">
      <EditorTitleBar
        title={displayedTitle}
        isSaving={isSaving}
        lastSavedAt={lastSavedAt}
        revision={currentDocument?.revision}
        syncMode={syncMode}
        conflictMessage={conflictMessage}
        onTitleChange={(value) => {
          titleRef.current = value;
          setTitleDraft(value);

          const currentContent =
            editor?.getJSON() ??
            currentDocument?.content ??
            emptyDocumentContent;

          saveDocument({
            title: value,
            content: currentContent,
          });
        }}
        onSyncModeChange={setSyncMode}
        onExportMetrics={() => {
          console.table(metrics.samples);
        }}
      />

      <EditorToolbar editor={editor} />
      <EditorArea editor={editor} />
      <PresenceBar
        metrics={metrics}
        pollIntervalMs={pollIntervalMs}
        onPollIntervalChange={(intervalMs) => {
          setPollIntervalMs(Math.max(500, intervalMs || 500));
        }}
      />
    </div>
  );
}
