import type { CSSProperties } from "react";
import type { Document } from "../types/document.types";
import {
    generateDocumentPreview,
    type PreviewBlock,
    type PreviewSegment,
} from "../utils/generateDocumentPreview";

type Props = {
    document: Document;
};

function getHeadingStyle(level: number): CSSProperties {
    switch (level) {
        case 1:
            return { fontSize: "11px", fontWeight: 700, lineHeight: 1.25 };
        case 2:
            return { fontSize: "10.5px", fontWeight: 700, lineHeight: 1.25 };
        case 3:
            return { fontSize: "10px", fontWeight: 600, lineHeight: 1.25 };
        default:
            return { fontSize: "9.5px", fontWeight: 600, lineHeight: 1.25 };
    }
}

function renderSegment(segment: PreviewSegment, index: number) {
    const style: CSSProperties = {
        color: segment.styles.color,
        backgroundColor: segment.styles.highlight,
        fontWeight: segment.styles.bold ? 700 : undefined,
        fontStyle: segment.styles.italic ? "italic" : undefined,
        textDecoration: segment.styles.underline ? "underline" : undefined,
    };

    return (
        <span key={index} style={style}>
            {segment.text}
        </span>
    );
}

function renderBlock(block: PreviewBlock, index: number) {
    if (block.type === "heading") {
        return (
            <p
                key={index}
                className="mb-1 break-words"
                style={getHeadingStyle(block.level)}
            >
                {block.segments.map(renderSegment)}
            </p>
        );
    }

    if (block.type === "list-item") {
        return (
            <div
                key={index}
                className="mb-0.5 flex items-start gap-1 break-words text-[9px] leading-[1.35]"
            >
                <span className="shrink-0 text-[9px] text-(--fg)">
                    {block.ordered ? `${block.index}.` : "•"}
                </span>
                <p className="min-w-0 flex-1 break-words">
                    {block.segments.map(renderSegment)}
                </p>
            </div>
        );
    }

    return (
        <p
            key={index}
            className="mb-0.5 break-words text-[9px] leading-[1.35]"
        >
            {block.segments.map(renderSegment)}
        </p>
    );
}

export default function DocumentCardPreview({ document }: Props) {
    const blocks = generateDocumentPreview(document.content);

    return (
        <div className="aspect-[3/4] bg-[#f1f3f4] p-2">
            <div className="h-full w-full overflow-hidden border border-[#e0e0e0] bg-white px-3 py-3 shadow-sm">
                {blocks.length === 0 ? (
                    <span className="text-[9px] leading-[1.35] text-[#9aa0a6]">
                        Empty document
                    </span>
                ) : (
                    <div className="h-full overflow-hidden text-[#202124]">
                        {blocks.map(renderBlock)}
                    </div>
                )}
            </div>
        </div>
    );
}