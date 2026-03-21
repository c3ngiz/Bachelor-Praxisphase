import { generateDocumentPreview } from "../utils/generateDocumentPreview";

type Props = {
    document: any;
};

export default function DocumentCardPreview({ document }: Props) {
    const blocks = generateDocumentPreview(document.content);

    return (
        <div className="aspect-[3/4] bg-gray-100 flex items-center justify-center p-2">
            <div className="bg-white shadow-sm w-full h-full p-3 text-[10px] overflow-hidden leading-tight space-y-1">

                {blocks.length === 0 ? (
                    <span className="text-gray-400">Empty document</span>
                ) : (
                    blocks.map((block, i) => {
                        if (block.type === "heading") {
                            return (
                                <p key={i} className="font-semibold text-[11px] truncate">
                                    {block.text}
                                </p>
                            );
                        }

                        if (block.type === "list-item") {
                            return (
                                <p key={i} className="pl-2 before:content-['•'] before:mr-1 truncate">
                                    {block.text}
                                </p>
                            );
                        }

                        return (
                            <p key={i} className="truncate">
                                {block.text}
                            </p>
                        );
                    })
                )}

            </div>
        </div>
    );
}