import { Checkbox, Popover, Select } from "@/shared/components/ui";
import { Funnel, SlidersHorizontal } from "lucide-react";
import { useMemo } from "react";

import { selectDocumentAuthors, useDocumentsStore } from "@/features/documents";
import { useDashboardViewControls } from "../../hooks/useDashboardViewControls";

/**
 * FilterDropdown component.
 */
export default function FilterDropdown() {
  const documents = useDocumentsStore((s) => s.documents);

  const { filters, setFilters, resetFilters } = useDashboardViewControls();

  const authorOptions = useMemo(() => {
    return selectDocumentAuthors(documents);
  }, [documents]);

  const activeCount =
    (filters.author !== "all" ? 1 : 0) +
    (filters.onlyEmpty ? 1 : 0) +
    (filters.onlyRecentlyOpened ? 1 : 0);

  return (
    <Popover.Root>
      <Popover.Trigger>
        <button
          type="button"
          className="
                  relative inline-flex h-10 w-30 items-center justify-center gap-2
                        rounded-xl border border-(--border) bg-white px-3
                        text-sm font-semibold text-(--fg)
                        shadow-sm transition-[background-color,border-color,color] duration-150
                        hover:border-(--accent) hover:text-(--accent)
                    "
          aria-label="Filter documents"
        >
          <SlidersHorizontal size={16} />
          <span>Filter</span>

          {activeCount > 0 ? (
            <span className="inline-flex min-w-5 items-center justify-center rounded-md bg-(--accent) px-1.5 py-0.5 text-[11px] font-semibold text-white">
              {activeCount}
            </span>
          ) : null}
        </button>
      </Popover.Trigger>

      <Popover.Content align="right" offset={10} className="w-80 p-4">
        <>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-(--fg)">
              <Funnel size={16} />
              Filters
            </div>

            <button
              type="button"
              onClick={() => {
                resetFilters();
              }}
              className="
                                inline-flex h-8 items-center justify-center rounded-lg px-2.5
                                text-xs font-medium text-(--fg-muted)
                                transition-colors hover:bg-(--bg) hover:text-(--fg)
                            "
            >
              Reset
            </button>
          </div>

          <div className="mb-4 border-t border-(--border)" />

          <div className="space-y-4">
            <Select
              label="Author"
              value={filters.author}
              onChange={(e) => setFilters({ author: e.target.value })}
              options={authorOptions}
            />

            <Checkbox
              label="Only empty documents"
              checked={filters.onlyEmpty}
              onChange={(e) => setFilters({ onlyEmpty: e.target.checked })}
            />

            <Checkbox
              label="Opened in last 7 days"
              checked={filters.onlyRecentlyOpened}
              onChange={(e) =>
                setFilters({ onlyRecentlyOpened: e.target.checked })
              }
            />
          </div>
        </>
      </Popover.Content>
    </Popover.Root>
  );
}
