import { useEffect, useState } from "react";
import type { Document } from "../types";

const STORAGE_KEY = "documents";

function loadDocuments(): Document[] {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) return [];

  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveDocuments(documents: Document[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(documents));
}

export function useDocumentsStore() {
  const [documents, setDocuments] = useState<Document[]>([]);

  useEffect(() => {
    setDocuments(loadDocuments());
  }, []);

  function createDocument(title: string): Document {
    const newDoc: Document = {
      id: crypto.randomUUID(),
      title,
      updatedAt: new Date().toISOString().slice(0, 10),
    };

    const updated = [newDoc, ...documents];

    setDocuments(updated);
    saveDocuments(updated);

    return newDoc;
  }

  function updateDocument(updatedDoc: Document) {
    const updated = documents.map((doc) =>
      doc.id === updatedDoc.id ? updatedDoc : doc,
    );

    setDocuments(updated);
    saveDocuments(updated);
  }

  function deleteDocument(id: string) {
    const updated = documents.filter((doc) => doc.id !== id);

    setDocuments(updated);
    saveDocuments(updated);
  }

  return {
    documents,
    createDocument,
    updateDocument,
    deleteDocument,
  };
}
