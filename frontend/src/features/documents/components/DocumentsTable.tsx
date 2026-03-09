import type { Document } from "../types"
import DocumentRow from "./DocumentRow"

type Props = {
    documents: Document[]
}

export default function DocumentsTable({ documents }: Props) {
    return (
        <section className="space-y-4">
            <div className="overflow-hidden rounded-lg border border-(--border) bg-(--bg)">
                <table className="w-full">
                    <thead className="bg-(--bg-elevated)">
                        <tr>
                            <th className="px-4 py-3 text-left text-sm font-medium text-(--fg)">
                                Title
                            </th>

                            <th className="px-4 py-3 text-left text-sm font-medium text-(--fg)">
                                Last Updated
                            </th>
                        </tr>
                    </thead>

                    <tbody>
                        {documents.map((doc) => (
                            <DocumentRow key={doc.id} document={doc} />
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    )
}