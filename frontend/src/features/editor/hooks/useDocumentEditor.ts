import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import { type Editor, useEditor } from "@tiptap/react";
import type { HocuspocusProvider } from "@hocuspocus/provider";
import type { Doc } from "yjs";

import type { Document, UpdateDocumentInput } from "@/features/documents";
import { createEditorExtensions } from "../editorKit/editorExtensions";
import type { SyncMode } from "../services/documentSync";

type SnapshotFactory = () => Omit<UpdateDocumentInput, "expectedRevision">;

type UseDocumentEditorInput = {
  currentDocument: Document | undefined;
  hasPendingLocalChanges: boolean;
  scheduleSave: (createSnapshot: SnapshotFactory) => void;
  titleRef: MutableRefObject<string>;
  syncMode: SyncMode;
  canEdit: boolean;
  collaboration: {
    document: Doc | null;
    provider: HocuspocusProvider | null;
    user: { name: string; color: string } | null;
    markTyping: () => void;
  };
};

const emptyDocumentContent = { type: "doc", content: [] };

export function useDocumentEditor({
  currentDocument,
  hasPendingLocalChanges,
  scheduleSave,
  titleRef,
  syncMode,
  canEdit,
  collaboration,
}: UseDocumentEditorInput): Editor | null {
  const appliedEditorSnapshotRef = useRef<string | null>(null);
  const isCollaborationReady =
    syncMode === "collaboration" &&
    Boolean(collaboration.document && collaboration.provider && collaboration.user);

  const extensions = useMemo(() => {
    if (
      syncMode === "collaboration" &&
      collaboration.document &&
      collaboration.provider &&
      collaboration.user
    ) {
      return createEditorExtensions({
        mode: "collaboration",
        document: collaboration.document,
        provider: collaboration.provider,
        user: collaboration.user,
      });
    }

    return createEditorExtensions({ mode: "polling" });
  }, [
    syncMode,
    collaboration.document,
    collaboration.provider,
    collaboration.user,
  ]);

  const editor = useEditor(
    {
      extensions,
      content:
        syncMode === "polling"
          ? currentDocument?.content ?? emptyDocumentContent
          : "",
      editable:
        canEdit &&
        (syncMode === "polling" || isCollaborationReady),
      onUpdate({ editor, transaction }) {
        if (syncMode === "collaboration") {
          if (transaction.docChanged) {
            collaboration.markTyping();
          }
          return;
        }

        scheduleSave(() => {
          return {
            title: titleRef.current,
            content: editor.getJSON(),
          };
        });
      },
    },
    [
      syncMode,
      collaboration.document,
      collaboration.provider,
      collaboration.user?.name,
      collaboration.user?.color,
      currentDocument?.id,
      canEdit,
    ],
  );

  useEffect(() => {
    editor?.setEditable(
      canEdit &&
        (syncMode === "polling" || isCollaborationReady),
      false,
    );
  }, [canEdit, editor, isCollaborationReady, syncMode]);

  useEffect(() => {
    appliedEditorSnapshotRef.current = null;
  }, [currentDocument?.id, syncMode]);

  useEffect(() => {
    if (syncMode === "collaboration") return;
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
  }, [currentDocument, editor, hasPendingLocalChanges, syncMode]);

  return editor;
}
