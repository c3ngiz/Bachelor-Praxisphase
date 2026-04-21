import { useMemo } from "react";
import type { DashboardFilters } from "../store/dashboardViewStore";
import {
  DEFAULT_DOCUMENT_FILTERS,
  filterDocuments,
  type Document,
} from "@/features/documents";

const DEFAULT_FILTERS: DashboardFilters = DEFAULT_DOCUMENT_FILTERS;

/**
 * Returns documents filtered by dashboard search text and active filter settings.
 */
export function useDocumentSearch(
  documents: Document[],
  query: string,
  filters: DashboardFilters = DEFAULT_FILTERS,
): Document[] {
  return useMemo(() => {
    return filterDocuments(documents, query, filters);
  }, [documents, query, filters]);
}
