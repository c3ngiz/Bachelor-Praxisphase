import { useParams } from "react-router-dom"
import { useEffect, useMemo, useRef } from "react"

import { useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import BulletList from "@tiptap/extension-bullet-list"
import OrderedList from "@tiptap/extension-ordered-list"

import Color from "@tiptap/extension-color"
import { TextStyle } from "@tiptap/extension-text-style"
import FontSize from "@tiptap/extension-text-style/font-size"
import Highlight from "@tiptap/extension-highlight"
import Image from "@tiptap/extension-image"
import TextAlign from "@tiptap/extension-text-align"
import Link from "@tiptap/extension-link"
import FontFamily from "@tiptap/extension-font-family"
import Underline from "@tiptap/extension-underline"

import EditorToolbar from "../components/EditorToolbar"
import EditorArea from "../components/EditorArea"
import PresenceBar from "../components/PresenceBar"
import EditorTitleBar from "../components/EditorTitleBar"

import { useDocumentsStore } from "@/features/dashboard/store/documentsStore"

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

        if (editor && editor.getHTML() !== currentDocument.content) {
            editor.commands.setContent(currentDocument.content, {
                emitUpdate: false,
            })
        }
    }, [currentDocument, editor])

    return (
        <div className="flex flex-col h-screen">

            <EditorTitleBar
                title={currentDocument?.title ?? ""}
                onTitleChange={(value) => {
                    if (!id) return

                    const currentContent =
                        editor?.getHTML() ??
                        currentDocument?.content ??
                        ""

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