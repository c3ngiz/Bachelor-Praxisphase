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
        grid-cols-1
        gap-5
        px-6
        py-6
        sm:grid-cols-2
        md:grid-cols-3
        lg:grid-cols-4
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