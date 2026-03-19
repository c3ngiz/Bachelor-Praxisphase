import type { Document } from "../types/document.types";

const STORAGE_KEY = "documents";

export function loadDocuments(): Document[] {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) return [];

  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveDocuments(documents: Document[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(documents));
}
