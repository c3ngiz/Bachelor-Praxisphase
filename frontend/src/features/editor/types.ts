export type EditorContent = string;

export interface EditorDocument {
  id: string;
  title: string;
  content: EditorContent;
  updatedAt: string;
}
