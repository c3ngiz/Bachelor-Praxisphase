import type { Document } from "../types/document.types";
import { generateDocumentPreview } from "../utils/generateDocumentPreview";

type Props = {
    document: Document;
};

export default function DocumentCardPreview({ document }: Props) {
    const preview = generateDocumentPreview(document.content);

    return (
        <div
            className="
        text-sm
        text-(--fg-muted)
        line-clamp-4
        leading-relaxed
        min-h-[72px]
      "
        >
            {preview || "Empty document"}
        </div>
    );
}