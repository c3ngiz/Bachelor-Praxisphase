import { useMemo } from "react";
import type { DashboardFilters } from "../store/dashboardStore";
import {
  DEFAULT_DOCUMENT_FILTERS,
  filterDocuments,
  type Document,
} from "@/features/documents";

const DEFAULT_FILTERS: DashboardFilters = DEFAULT_DOCUMENT_FILTERS;

export function useDocumentSearch(
  documents: Document[],
  query: string,
  filters: DashboardFilters = DEFAULT_FILTERS,
): Document[] {
  return useMemo(() => {
    return filterDocuments(documents, query, filters);
  }, [documents, query, filters]);
}
