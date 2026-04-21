import { Checkbox, Select } from "@/shared/components/ui";
import Popover from "@/shared/components/ui/Popover";
import { Funnel, SlidersHorizontal } from "lucide-react";
import { useMemo } from "react";

import { useDocumentsStore } from "@/features/documents";
import { useDashboardStore } from "../../store/dashboardStore";

export default function FilterDropdown() {
  const documents = useDocumentsStore((s) => s.documents);

  const filters = useDashboardStore((s) => s.filters);
  const setFilters = useDashboardStore((s) => s.setFilters);
  const resetFilters = useDashboardStore((s) => s.resetFilters);

  const authorOptions = useMemo(() => {
    const authors = Array.from(new Set(documents.map((d) => d.author))).sort();

    return [
      { value: "all", label: "All authors" },
      ...authors.map((author) => ({ value: author, label: author })),
    ];
  }, [documents]);

  const activeCount =
    (filters.author !== "all" ? 1 : 0) +
    (filters.onlyEmpty ? 1 : 0) +
    (filters.onlyRecentlyOpened ? 1 : 0);

  return (
    <Popover
      align="right"
      offset={10}
      className="w-80 rounded-xl border border-(--border) bg-(--bg-elevated) p-4 shadow-[0_10px_30px_rgba(15,23,42,0.10)]"
      trigger={({ toggle }) => (
        <button
          type="button"
          onClick={toggle}
          className="
                        relative inline-flex h-9 w-[7.5rem] items-center justify-center gap-2
                        rounded-lg px-3 text-sm font-medium text-(--fg)
                        transition-[background-color,color] duration-150
                        hover:bg-(--bg) active:bg-(--bg)
                    "
          aria-label="Filter documents"
        >
          <SlidersHorizontal size={16} />
          <span>Filter</span>

          {activeCount > 0 ? (
            <span className="inline-flex min-w-5 items-center justify-center rounded-md bg-(--bg) px-1.5 py-0.5 text-[11px] font-semibold text-(--fg)">
              {activeCount}
            </span>
          ) : null}
        </button>
      )}
    >
      {({ close }) => (
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
                close();
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
      )}
    </Popover>
  );
}