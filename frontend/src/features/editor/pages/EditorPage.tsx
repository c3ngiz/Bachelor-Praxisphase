import { useParams } from "react-router-dom"
import { useEffect, useMemo, useRef } from "react"

import { useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Color from "@tiptap/extension-color"
import { TextStyle } from "@tiptap/extension-text-style"

import EditorToolbar from "../components/EditorToolbar"
import EditorArea from "../components/EditorArea"
import PresenceBar from "../components/PresenceBar"
import EditorTitleBar from "../components/EditorTitleBar"

import { useDocumentsStore } from "@/features/documents/state/documentsStore"

export default function EditorPage() {
    const { id } = useParams()

    const { documents, updateDocument } = useDocumentsStore()

    const titleRef = useRef("")
    const idRef = useRef(id)

    useEffect(() => {
        idRef.current = id
    }, [id])

    const currentDocument = useMemo(() => {
        if (!id) return undefined

        return documents.find((doc) => doc.id === id)
    }, [documents, id])

    useEffect(() => {
        titleRef.current = currentDocument?.title ?? ""
    }, [currentDocument?.title])

    const editor = useEditor({
        extensions: [StarterKit, TextStyle, Color],
        content: "",

        onUpdate({ editor }) {
            const html = editor.getHTML()

            if (!idRef.current) return

            updateDocument({
                id: idRef.current,
                title: titleRef.current,
                content: html,
                updatedAt: new Date().toISOString(),
            })
        },
    })

    useEffect(() => {
        if (!currentDocument) return

        // TipTap only uses `content` during init, so set document contents explicitly.
        if (editor && editor.getHTML() !== currentDocument.content) {
            editor.commands.setContent(currentDocument.content, { emitUpdate: false })
        }
    }, [currentDocument, editor])

    return (
        <div className="flex flex-col h-screen">

            <EditorTitleBar
                title={currentDocument?.title ?? ""}
                onTitleChange={(value) => {
                    if (!id) return

                    const currentContent = editor?.getHTML() ?? currentDocument?.content ?? ""

                    updateDocument({
                        id,
                        title: value,
                        content: currentContent,
                        updatedAt: new Date().toISOString(),
                    })
                }}
            />

            <EditorToolbar editor={editor} />

            <EditorArea editor={editor} />

            <PresenceBar />

        </div>
    )
}