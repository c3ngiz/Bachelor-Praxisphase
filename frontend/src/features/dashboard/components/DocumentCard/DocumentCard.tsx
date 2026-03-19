import type { Document } from "../../types/document.types";
import { useDashboardStore } from "../../store/dashboardStore";
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
    const selectedDocuments = useDashboardStore((s) => s.selectedDocuments);
    const isSelected = selectedDocuments.has(document.id);

    return (
        <div
            className={[
                "flex flex-col gap-3 rounded-xl border bg-(--bg-elevated) p-4 shadow-sm transition-all hover:shadow-md",
                isSelected
                    ? "border-(--accent) ring-2 ring-(--accent)"
                    : "border-(--border)",
            ].join(" ")}
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