export function generateDocumentPreview(content: any): string {
  if (!content || !content.content) {
    return "";
  }

  const texts: string[] = [];

  function extractText(node: any) {
    if (node.text) {
      texts.push(node.text);
    }

    if (Array.isArray(node.content)) {
      node.content.forEach(extractText);
    }
  }

  content.content.forEach(extractText);

  return texts.join(" ").trim().slice(0, 140);
}
