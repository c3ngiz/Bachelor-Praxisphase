import type { Document } from "../../types/document.types";
import DocumentRow from "../DocumentRow";

type Props = {
    documents: Document[];

    onOpen?: (id: string) => void;
    onRename?: (id: string) => void;
    onDelete?: (id: string) => void;
};

export default function DocumentsTable({
    documents,
    onOpen,
    onRename,
    onDelete,
}: Props) {
    return (
        <div className="px-6 py-6">
            <div className="overflow-hidden rounded-xl border border-(--border) bg-(--bg-elevated)">
                <table className="w-full text-sm">
                    <thead className="border-b border-(--border) text-left text-(--fg-muted)">
                        <tr>
                            <th className="w-10 px-4 py-3"></th>
                            <th className="px-4 py-3">Title</th>
                            <th className="px-4 py-3">Author</th>
                            <th className="px-4 py-3">Created</th>
                            <th className="px-4 py-3">Updated</th>
                            <th className="w-48 px-4 py-3">Actions</th>
                        </tr>
                    </thead>

                    <tbody>
                        {documents.map((doc) => (
                            <DocumentRow
                                key={doc.id}
                                document={doc}
                                onOpen={onOpen}
                                onRename={onRename}
                                onDelete={onDelete}
                            />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}