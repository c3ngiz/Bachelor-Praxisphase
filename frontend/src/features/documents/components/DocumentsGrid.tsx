import type { Document } from "../types"
import DocumentCard from "./DocumentCard"

type Props = {
    documents: Document[]
    onRename: (document: Document) => void
    onDelete: (document: Document) => void
}

export default function DocumentsGrid({ documents, onRename, onDelete }: Props) {
    return (
        <section className="space-y-4">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {documents.map((doc) => (
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