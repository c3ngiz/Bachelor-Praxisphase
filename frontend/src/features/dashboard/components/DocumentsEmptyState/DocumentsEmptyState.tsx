import Button from "@/shared/components/ui/Button";

type Props = {
    onCreateDocument?: () => void;
};

export default function DocumentsEmptyState({ onCreateDocument }: Props) {
    return (
        <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
            <div className="mb-4 text-lg font-semibold text-(--fg)">
                No documents yet
            </div>

            <p className="mb-6 max-w-md text-sm text-(--fg-muted)">
                Create your first document to start writing and collaborating.
            </p>

            <Button onClick={onCreateDocument}>
                Create Document
            </Button>
        </div>
    );
}