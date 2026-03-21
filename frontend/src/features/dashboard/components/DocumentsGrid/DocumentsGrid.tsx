import type { Document } from "../../types/document.types";
import CreateDocumentCard from "../CreateDocumentCard/CreateDocumentCard";
import DocumentCard from "../DocumentCard";

type Props = {
    documents: Document[];
    onOpen?: (id: string) => void;
    onRename?: (id: string) => void;
    onDelete?: (id: string) => void;
    onCreate?: () => void;
};

export default function DocumentsGrid({
    documents,
    onOpen,
    onRename,
    onDelete,
    onCreate,
}: Props) {
    return (
        <div
            className="
                grid
                grid-cols-[repeat(auto-fill,minmax(220px,1fr))]
                gap-6
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

            <CreateDocumentCard onCreate={onCreate ?? (() => { })} />
        </div>
    );
}