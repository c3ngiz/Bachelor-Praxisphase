import type { Document } from "../../types/document.types";
import DocumentCard from "../DocumentCard";

type Props = {
    documents: Document[];
};

export default function DocumentsGrid({ documents }: Props) {
    return (
        <div
            className="
        grid
        grid-cols-1
        sm:grid-cols-2
        md:grid-cols-3
        lg:grid-cols-4
        gap-5
        px-6
        py-6
      "
        >
            {documents.map((doc) => (
                <DocumentCard key={doc.id} document={doc} />
            ))}
        </div>
    );
}