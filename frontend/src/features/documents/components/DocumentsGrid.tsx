import type { Document } from "../types"
import DocumentCard from "./DocumentCard"

type Props = {
    documents: Document[]
}

export default function DocumentsGrid({ documents }: Props) {
    return (
        <section className="space-y-4">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {documents.map((doc) => (
                    <DocumentCard key={doc.id} document={doc} />
                ))}
            </div>
        </section>
    )
}