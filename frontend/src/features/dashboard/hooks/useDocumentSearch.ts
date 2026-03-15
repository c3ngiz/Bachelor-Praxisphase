import { useMemo } from "react";
import type { Document } from "../types/document.types";
import { filterDocuments } from "../utils/filterDocuments";

export function useDocumentSearch(
  documents: Document[],
  query: string,
): Document[] {
  const filteredDocuments = useMemo(() => {
    return filterDocuments(documents, query);
  }, [documents, query]);

  return filteredDocuments;
}
