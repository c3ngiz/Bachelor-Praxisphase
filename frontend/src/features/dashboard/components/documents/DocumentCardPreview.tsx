import type { CSSProperties } from "react";
import type { Document } from "@/features/documents";
import {
    generateDocumentPreview,
    type PreviewBlock,
    type PreviewContent,
    type PreviewSegment,
} from "../../utils/generateDocumentPreview";

type Props = {
    document: Document;
};

const PREVIEW_SCALE = 0.42;

function getHeadingClass(level: number): string {
    switch (level) {
        case 1:
            return "mb-3 text-[26px] font-semibold leading-[1.25]";
        case 2:
            return "mb-2.5 text-[22px] font-semibold leading-[1.25]";
        case 3:
            return "mb-2 text-[18px] font-semibold leading-[1.3]";
        default:
            return "mb-2 text-[16px] font-semibold leading-[1.3]";
    }
}

function getSegmentStyle(segment: PreviewSegment): CSSProperties {
    return {
        color: segment.styles.color,
        backgroundColor: segment.styles.highlight,
        fontWeight: segment.styles.bold ? 700 : undefined,
        fontStyle: segment.styles.italic ? "italic" : undefined,
        textDecoration: segment.styles.underline ? "underline" : undefined,
    };
}

function renderSegment(segment: PreviewSegment, index: number) {
    return (
        <span key={index} style={getSegmentStyle(segment)}>
            {segment.text}
        </span>
    );
}

function renderBlock(block: PreviewBlock, index: number) {
    if (block.type === "heading") {
        return (
            <p key={index} className={getHeadingClass(block.level)}>
                {block.segments.map(renderSegment)}
            </p>
        );
    }

    if (block.type === "list-item") {
        return (
            <div
                key={index}
                className="mb-2 flex items-start gap-3 text-[14px] leading-[1.5]"
            >
                <span className="shrink-0 text-[14px] text-[#202124]">
                    {block.ordered ? `${block.index}.` : "•"}
                </span>
                <p className="min-w-0 flex-1 break-words">
                    {block.segments.map(renderSegment)}
                </p>
            </div>
        );
    }

    return (
        <p key={index} className="mb-2 text-[14px] leading-[1.5] break-words">
            {block.segments.map(renderSegment)}
        </p>
    );
}

/**
 * DocumentCardPreview component.
 */
export default function DocumentCardPreview({ document }: Props) {
    const blocks = generateDocumentPreview(document.content as PreviewContent);

    return (
        <div className="aspect-[3/4] bg-[#f1f3f4] p-3">
            <div
                className="
          h-full w-full overflow-hidden border border-[#e0e0e0] bg-white
          shadow-[0_1px_2px_rgba(60,64,67,0.15),0_1px_3px_1px_rgba(60,64,67,0.08)]
          transition-transform duration-200 ease-out
          group-hover:scale-[1.02]
        "
            >
                <div
                    className="h-full w-full origin-top-left"
                    style={{
                        transform: `scale(${PREVIEW_SCALE})`,
                        width: `${100 / PREVIEW_SCALE}%`,
                        height: `${100 / PREVIEW_SCALE}%`,
                    }}
                >
                    <div className="h-full w-full overflow-hidden px-10 py-10 text-[#202124]">
                        {blocks.length === 0 ? (
                            <div className="space-y-3 pt-1">
                                <div className="h-3 w-3/4 rounded bg-[#eceff1]" />
                                <div className="h-3 w-5/6 rounded bg-[#eceff1]" />
                                <div className="h-3 w-2/3 rounded bg-[#eceff1]" />
                                <div className="h-3 w-4/5 rounded bg-[#eceff1]" />
                                <div className="h-3 w-1/2 rounded bg-[#eceff1]" />
                            </div>
                        ) : (
                            <div>{blocks.map(renderBlock)}</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}