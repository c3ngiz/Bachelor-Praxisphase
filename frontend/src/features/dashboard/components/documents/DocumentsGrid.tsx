import { Grid } from "@/shared/components/ui";
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
        <Grid>
            {documents.map((doc) => (
                <DocumentCard
                    key={doc.id}
                    document={doc}
                    onOpen={onOpen}
                    onRename={onRename}
                    onDelete={onDelete}
                />
            ))}
        </Grid>
    );
}
