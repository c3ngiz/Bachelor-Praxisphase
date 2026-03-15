import Button from "@/shared/components/ui/Button";
import type { Document } from "../../types/document.types";

type Props = {
    document: Document;
    onOpen?: (id: string) => void;
    onRename?: (id: string) => void;
    onDelete?: (id: string) => void;
};

export default function DocumentControls({
    document,
    onOpen,
    onRename,
    onDelete,
}: Props) {
    return (
        <div className="flex items-center justify-between gap-2 pt-2">
            <Button
                variant="primary"
                className="flex-1"
                onClick={() => onOpen?.(document.id)}
            >
                Open
            </Button>

            <Button
                variant="secondary"
                className="px-3"
                onClick={() => onRename?.(document.id)}
            >
                Rename
            </Button>

            <Button
                variant="ghost"
                className="px-3 text-red-500"
                onClick={() => onDelete?.(document.id)}
            >
                Delete
            </Button>
        </div>
    );
}