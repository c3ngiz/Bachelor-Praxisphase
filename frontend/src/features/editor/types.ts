export type EditorContent = any;

export interface EditorDocument {
  id: string;
  title: string;
  content: EditorContent;
  updatedAt: string;
}
