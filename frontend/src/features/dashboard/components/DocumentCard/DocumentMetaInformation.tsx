import type { Document } from "../../types/document.types";

type Props = {
    document: Document;
};

function formatDate(date: string) {
    return new Date(date).toLocaleDateString();
}

export default function DocumentMetaInformation({ document }: Props) {
    return (
        <div className="flex flex-col text-xs text-(--fg-muted) gap-1">
            <span>Author: {document.author}</span>
            <span>Created: {formatDate(document.createdAt)}</span>
            <span>Updated: {formatDate(document.updatedAt)}</span>
        </div>
    );
}