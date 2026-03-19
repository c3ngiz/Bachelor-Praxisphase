import { useMemo } from "react";
import { useDocumentsStore } from "../store/documentsStore";
import type { Document } from "../types/document.types";

export function useRecentDocuments(): Document[] {
  const documents = useDocumentsStore((s) => s.documents);

  const recentDocuments = useMemo(() => {
    return [...documents]
      .filter((doc) => doc.lastOpenedAt)
      .sort((a, b) => {
        return (
          new Date(b.lastOpenedAt!).getTime() -
          new Date(a.lastOpenedAt!).getTime()
        );
      })
      .slice(0, 3);
  }, [documents]);

  return recentDocuments;
}
