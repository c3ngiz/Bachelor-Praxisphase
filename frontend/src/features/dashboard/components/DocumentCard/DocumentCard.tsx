import type { Document } from "../../types/document.types";
import DocumentCardHeader from "./DocumentCardHeader";
import DocumentCardPreview from "./DocumentCardPreview";
import DocumentMetaInformation from "./DocumentMetaInformation";
import DocumentControls from "./DocumentControls";

type Props = {
    document: Document;

    onOpen?: (id: string) => void;
    onRename?: (id: string) => void;
    onDelete?: (id: string) => void;
};

export default function DocumentCard({
    document,
    onOpen,
    onRename,
    onDelete,
}: Props) {
    return (
        <div
            className="
        flex flex-col gap-3
        rounded-xl
        border border-(--border)
        bg-(--bg-elevated)
        p-4
        shadow-sm
        hover:shadow-md
        transition-shadow
      "
        >
            <DocumentCardHeader document={document} />

            <DocumentCardPreview document={document} />

            <DocumentMetaInformation document={document} />

            <DocumentControls
                document={document}
                onOpen={onOpen}
                onRename={onRename}
                onDelete={onDelete}
            />
        </div>
    );
}