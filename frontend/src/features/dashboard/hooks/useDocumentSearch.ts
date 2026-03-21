import { useMemo } from "react";
import type { Document } from "../types/document.types";
import type { DashboardFilters } from "../store/dashboardStore";
import { filterDocuments } from "../utils/filterDocuments";

export function useDocumentSearch(
  documents: Document[],
  query: string,
  filters: DashboardFilters,
): Document[] {
  const filteredDocuments = useMemo(() => {
    return filterDocuments(documents, query, filters);
  }, [documents, query, filters]);

  return filteredDocuments;
}
