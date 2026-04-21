import { useParams } from "react-router-dom";
import { useEffect, useMemo, useRef } from "react";

import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";

import Color from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import FontSize from "@tiptap/extension-text-style/font-size";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import FontFamily from "@tiptap/extension-font-family";
import Underline from "@tiptap/extension-underline";

import EditorToolbar from "../components/EditorToolbar";
import EditorArea from "../components/EditorArea";
import PresenceBar from "../components/PresenceBar";
import EditorTitleBar from "../components/EditorTitleBar";

import { useDocumentsStore } from "@/features/documents";
import { useAuth } from "@/features/auth";
import { useEditorSessionStore } from "../store/editorSessionStore";

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

    const titleRef = useRef("");
    const idRef = useRef(id);

    useEffect(() => {
        idRef.current = id;
    }, [id]);

    const currentDocument = useMemo(() => {
        if (!id) return undefined;
        return documents.find((doc) => doc.id === id);
    }, [documents, id]);

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
            const json = editor.getJSON();

            if (!idRef.current || !token) return;

            void (async () => {
                setIsSaving(true);
                try {
                    await updateDocument(
                        idRef.current!,
                        {
                            title: titleRef.current,
                            content: json,
                        },
                        token,
                    );
                    markSaved();
                } finally {
                    setIsSaving(false);
                }
            })();
        },
    });

    useEffect(() => {
        if (!currentDocument) return;
        if (!editor) return;

        const currentJSON = currentDocument.content ?? {
            type: "doc",
            content: [],
        };

        const editorJSON = editor.getJSON();

        if (JSON.stringify(editorJSON) !== JSON.stringify(currentJSON)) {
            editor.commands.setContent(currentJSON, {
                emitUpdate: false,
            });
        }
    }, [currentDocument, editor]);

    return (
        <div className="flex flex-col h-screen">
            <EditorTitleBar
                title={
                    sessionDocumentId === id
                        ? titleDraft
                        : currentDocument?.title ?? ""
                }
                isSaving={isSaving}
                lastSavedAt={lastSavedAt}
                onTitleChange={(value) => {
                    titleRef.current = value;
                    setTitleDraft(value);

                    if (!id || !token) return;

                    const currentContent =
                        editor?.getJSON() ??
                        currentDocument?.content ?? {
                            type: "doc",
                            content: [],
                        };

                    void (async () => {
                        setIsSaving(true);
                        try {
                            await updateDocument(
                                id,
                                {
                                    title: value,
                                    content: currentContent,
                                },
                                token,
                            );
                            markSaved();
                        } finally {
                            setIsSaving(false);
                        }
                    })();
                }}
            />

            <EditorToolbar editor={editor} />

            <EditorArea editor={editor} />

            <PresenceBar />
        </div>
    );
}