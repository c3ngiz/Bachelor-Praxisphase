export type EditorContent = unknown;

export interface EditorDocument {
  id: string;
  title: string;
  content: EditorContent;
  updatedAt: string;
}
