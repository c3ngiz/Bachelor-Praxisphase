import { useMemo } from "react";
import type { DashboardFilters } from "../store/dashboardStore";
import type { Document } from "@/features/documents";
import { filterDocuments } from "../utils/filterDocuments";

const DEFAULT_FILTERS: DashboardFilters = {
  author: "all",
  onlyEmpty: false,
  onlyRecentlyOpened: false,
};

export function useDocumentSearch(
  documents: Document[],
  query: string,
  filters: DashboardFilters = DEFAULT_FILTERS,
): Document[] {
  return useMemo(() => {
    return filterDocuments(documents, query, filters);
  }, [documents, query, filters]);
}
