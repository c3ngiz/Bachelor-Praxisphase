export interface Document {
  id: string;

  title: string;

  content: unknown; // Tiptap JSON

  author: string;

  createdAt: string;
  updatedAt: string;

  lastOpenedAt?: string;
}

export interface DocumentPreview {
  text: string;
}
