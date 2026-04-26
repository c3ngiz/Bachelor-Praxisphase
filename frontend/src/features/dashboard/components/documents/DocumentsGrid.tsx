import { Grid } from "@/shared/components/ui";
import type { Document } from "@/features/documents";
import type { WorkspaceMember } from "@/features/workspaces";
import DocumentCard from "./DocumentCard";

type Props = {
    documents: Document[];
    workspaceMembers?: WorkspaceMember[];
    onOpen?: (id: string) => void;
    onRename?: (id: string) => void;
    onDelete?: (id: string) => void;
};

/**
 * DocumentsGrid component.
 */
export default function DocumentsGrid({
    documents,
    workspaceMembers = [],
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
                    workspaceMembers={workspaceMembers}
                    onOpen={onOpen}
                    onRename={onRename}
                    onDelete={onDelete}
                />
            ))}
        </Grid>
    );
}
