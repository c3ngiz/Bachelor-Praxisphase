import { Button, EmptyState } from "@/shared/components/ui";
import { FileText } from "lucide-react";

type Props = {
    actionLabel?: string;
    description?: string;
    onCreateDocument?: () => void;
    showCreateAction?: boolean;
    title?: string;
};

/**
 * DocumentsEmptyState component.
 */
export default function DocumentsEmptyState({
    actionLabel = "Create Document",
    description = "Create your first document to start writing and collaborating.",
    onCreateDocument,
    showCreateAction = true,
    title = "No documents yet",
}: Props) {
    return (
        <EmptyState>
            <EmptyState.Icon>
                <FileText size={20} />
            </EmptyState.Icon>
            <EmptyState.Title>{title}</EmptyState.Title>
            <EmptyState.Description>
                {description}
            </EmptyState.Description>
            {showCreateAction ? (
                <EmptyState.Actions>
                    <Button onClick={onCreateDocument}>{actionLabel}</Button>
                </EmptyState.Actions>
            ) : null}
        </EmptyState>
    );
}
