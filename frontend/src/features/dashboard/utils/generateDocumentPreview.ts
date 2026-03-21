export function generateDocumentPreview(content: any): any[] {
  if (!content) return [];

  const blocks: any[] = [];

  function extract(node: any) {
    if (!node) return;

    // 🟢 TEXT NODE (this is the key!)
    if (node.type === "text" && node.text?.trim()) {
      blocks.push({
        type: "text",
        text: node.text,
      });
    }

    // 🟢 HEADING
    if (node.type === "heading") {
      const text = getText(node);
      if (text) {
        blocks.push({
          type: "heading",
          level: node.attrs?.level || 1,
          text,
        });
      }
    }

    // 🟢 PARAGRAPH
    if (node.type === "paragraph") {
      const text = getText(node);
      if (text) {
        blocks.push({
          type: "paragraph",
          text,
        });
      }
    }

    // 🟢 LIST ITEMS (IMPORTANT FIX)
    if (node.type === "listItem") {
      const text = getText(node);
      if (text) {
        blocks.push({
          type: "list-item",
          text,
        });
      }
    }

    // 🔁 ALWAYS recurse
    if (Array.isArray(node.content)) {
      node.content.forEach(extract);
    }
  }

  function getText(node: any): string {
    if (!node) return "";

    if (node.type === "text") return node.text || "";

    if (Array.isArray(node.content)) {
      return node.content.map(getText).join("");
    }

    return "";
  }

  extract(content);

  return blocks.slice(0, 12);
}
