import type { Document } from "../types"
import DocumentCard from "./DocumentCard"

type Props = {
    documents: Document[]
    onRename: (document: Document) => void
    onDelete: (document: Document) => void
}

export default function RecentDocuments({ documents, onRename, onDelete }: Props) {
    if (documents.length === 0) return null

    const recent = [...documents]
        .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
        .slice(0, 3)

    return (
        <section className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {recent.map((doc) => (
                    <DocumentCard
                        key={doc.id}
                        document={doc}
                        onRename={onRename}
                        onDelete={onDelete}
                    />
                ))}
            </div>
        </section>
    )
}