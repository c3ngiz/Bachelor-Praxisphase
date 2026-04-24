import type { Document } from "@/features/documents";
import DocumentCard from "./DocumentCard";

type Props = {
    documents: Document[];
    onOpen?: (id: string) => void;
    onRename?: (id: string) => void;
    onDelete?: (id: string) => void;
};

/**
 * DocumentsGrid component.
 */
export default function DocumentsGrid({
    documents,
    onOpen,
    onRename,
    onDelete,
}: Props) {
    return (
        <div
            className="
                grid
                grid-cols-[repeat(auto-fill,minmax(230px,1fr))]
                gap-x-5 gap-y-7
                items-start
            "
        >
            {documents.map((doc) => (
                <DocumentCard
                    key={doc.id}
                    document={doc}
                    onOpen={onOpen}
                    onRename={onRename}
                    onDelete={onDelete}
                />
            ))}
        </div>
    );
}
