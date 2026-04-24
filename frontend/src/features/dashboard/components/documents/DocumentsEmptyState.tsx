import { Button, EmptyState } from "@/shared/components/ui";
import { FileText } from "lucide-react";

type Props = {
    onCreateDocument?: () => void;
};

/**
 * DocumentsEmptyState component.
 */
export default function DocumentsEmptyState({ onCreateDocument }: Props) {
    return (
        <EmptyState>
            <EmptyState.Icon>
                <FileText size={20} />
            </EmptyState.Icon>
            <EmptyState.Title>No documents yet</EmptyState.Title>
            <EmptyState.Description>
                Create your first document to start writing and collaborating.
            </EmptyState.Description>
            <EmptyState.Actions>
                <Button onClick={onCreateDocument}>Create Document</Button>
            </EmptyState.Actions>
        </EmptyState>
    );
}
