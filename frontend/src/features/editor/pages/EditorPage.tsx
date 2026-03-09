import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"

import EditorToolbar from "../components/EditorToolbar"
import EditorArea from "../components/EditorArea"

import { useDocumentsStore } from "@/features/documents/state/documentsStore"
import type { Document } from "@/features/documents/types"

export default function EditorPage() {
    const { id } = useParams()

    const { getDocumentById, updateDocument } = useDocumentsStore()

    const [document, setDocument] = useState<Document | null>(null)

    useEffect(() => {
        if (!id) return

        const doc = getDocumentById(id)

        if (doc) {
            setDocument(doc)
        }
    }, [id, getDocumentById])

    function updateTitle(title: string) {
        if (!document) return

        const updated = {
            ...document,
            title,
            updatedAt: new Date().toISOString(),
        }

        setDocument(updated)
        updateDocument(updated)
    }

    function updateContent(content: string) {
        if (!document) return

        const updated = {
            ...document,
            content,
            updatedAt: new Date().toISOString(),
        }

        setDocument(updated)
        updateDocument(updated)
    }

    if (!document) {
        return (
            <div className="p-8 text-[var(--fg-muted)]">
                Document not found
            </div>
        )
    }

    return (
        <div className="flex flex-col h-screen">

            <EditorToolbar
                title={document.title}
                onTitleChange={updateTitle}
            />

            <div className="flex-1 p-8">
                <EditorArea
                    content={document.content}
                    onChange={updateContent}
                />
            </div>

        </div>
    )
}