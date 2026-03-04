import { useEffect, useState } from "react";
import { fetchDocuments } from "../api/documentsApi";
import type { Document } from "../types";

export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDocuments() {
      const docs = await fetchDocuments();
      setDocuments(docs);
      setLoading(false);
    }

    loadDocuments();
  }, []);

  return {
    documents,
    loading,
  };
}