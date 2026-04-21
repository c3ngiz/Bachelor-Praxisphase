export type PreviewMarkStyles = {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  color?: string;
  highlight?: string;
};

export type PreviewSegment = {
  text: string;
  styles: PreviewMarkStyles;
};

export type PreviewBlock =
  | {
      type: "paragraph";
      segments: PreviewSegment[];
    }
  | {
      type: "heading";
      level: number;
      segments: PreviewSegment[];
    }
  | {
      type: "list-item";
      ordered?: boolean;
      index?: number;
      segments: PreviewSegment[];
    };

function getMarkStyles(
  marks?: Array<{ type?: string; attrs?: Record<string, any> }>,
): PreviewMarkStyles {
  const styles: PreviewMarkStyles = {};

  if (!marks) return styles;

  for (const mark of marks) {
    if (!mark?.type) continue;

    switch (mark.type) {
      case "bold":
        styles.bold = true;
        break;
      case "italic":
        styles.italic = true;
        break;
      case "underline":
        styles.underline = true;
        break;
      case "textStyle":
        if (mark.attrs?.color) {
          styles.color = mark.attrs.color;
        }
        break;
      case "highlight":
        if (mark.attrs?.color) {
          styles.highlight = mark.attrs.color;
        } else {
          styles.highlight = "#fff59d";
        }
        break;
      default:
        break;
    }
  }

  return styles;
}

function stylesEqual(a: PreviewMarkStyles, b: PreviewMarkStyles): boolean {
  return (
    a.bold === b.bold &&
    a.italic === b.italic &&
    a.underline === b.underline &&
    a.color === b.color &&
    a.highlight === b.highlight
  );
}

function mergeAdjacentSegments(segments: PreviewSegment[]): PreviewSegment[] {
  const merged: PreviewSegment[] = [];

  for (const segment of segments) {
    if (!segment.text) continue;

    const previous = merged[merged.length - 1];

    if (previous && stylesEqual(previous.styles, segment.styles)) {
      previous.text += segment.text;
    } else {
      merged.push({
        text: segment.text,
        styles: { ...segment.styles },
      });
    }
  }

  return merged;
}

function extractSegments(node: any): PreviewSegment[] {
  if (!node) return [];

  if (node.type === "text") {
    const text = typeof node.text === "string" ? node.text : "";
    if (!text) return [];

    return [
      {
        text,
        styles: getMarkStyles(node.marks),
      },
    ];
  }

  if (!Array.isArray(node.content)) {
    return [];
  }

  const segments = node.content.flatMap((child: any) => extractSegments(child));
  return mergeAdjacentSegments(segments);
}

function hasVisibleText(segments: PreviewSegment[]): boolean {
  return segments.some((segment) => segment.text.trim().length > 0);
}

function extractListItemSegments(node: any): PreviewSegment[] {
  if (!node || node.type !== "listItem" || !Array.isArray(node.content)) {
    return [];
  }

  const segments = node.content.flatMap((child: any) => extractSegments(child));
  return mergeAdjacentSegments(segments);
}

function extractBlocksFromNode(node: any): PreviewBlock[] {
  if (!node) return [];

  switch (node.type) {
    case "doc":
      return Array.isArray(node.content)
        ? node.content.flatMap((child: any) => extractBlocksFromNode(child))
        : [];

    case "heading": {
      const segments = extractSegments(node);
      if (!hasVisibleText(segments)) return [];

      return [
        {
          type: "heading",
          level: Number(node.attrs?.level) || 1,
          segments,
        },
      ];
    }

    case "paragraph": {
      const segments = extractSegments(node);
      if (!hasVisibleText(segments)) return [];

      return [
        {
          type: "paragraph",
          segments,
        },
      ];
    }

    case "bulletList": {
      if (!Array.isArray(node.content)) return [];

      return node.content
        .map((item: any) => extractListItemSegments(item))
        .filter(hasVisibleText)
        .map((segments: PreviewSegment[]) => ({
          type: "list-item" as const,
          segments,
        }));
    }

    case "orderedList": {
      if (!Array.isArray(node.content)) return [];

      return node.content
        .map((item: any, index: number) => ({
          segments: extractListItemSegments(item),
          index,
        }))
        .filter(({ segments }: { segments: PreviewSegment[] }) =>
          hasVisibleText(segments),
        )
        .map(
          ({
            segments,
            index,
          }: {
            segments: PreviewSegment[];
            index: number;
          }) => ({
            type: "list-item" as const,
            ordered: true,
            index: index + 1,
            segments,
          }),
        );
    }

    default:
      return Array.isArray(node.content)
        ? node.content.flatMap((child: any) => extractBlocksFromNode(child))
        : [];
  }
}

export function generateDocumentPreview(content: any): PreviewBlock[] {
  if (!content || typeof content !== "object") return [];

  const blocks = extractBlocksFromNode(content);

  return blocks.slice(0, 12);
}
