import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Checkbox, Select } from "@/shared/components/ui";
import { Funnel, SlidersHorizontal } from "lucide-react";

import { useDocumentsStore } from "../../store/documentsStore";
import { useDashboardStore } from "../../store/dashboardStore";

export default function FilterDropdown() {
  const documents = useDocumentsStore((s) => s.documents);

  const filters = useDashboardStore((s) => s.filters);
  const setFilters = useDashboardStore((s) => s.setFilters);
  const resetFilters = useDashboardStore((s) => s.resetFilters);

  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  const authorOptions = useMemo(() => {
    const authors = Array.from(new Set(documents.map((d) => d.author))).sort();

    return [
      { value: "all", label: "All authors" },
      ...authors.map((a) => ({ value: a, label: a })),
    ];
  }, [documents]);

  const activeCount =
    (filters.author !== "all" ? 1 : 0) +
    (filters.onlyEmpty ? 1 : 0) +
    (filters.onlyRecentlyOpened ? 1 : 0);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setIsOpen(false);
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="ghost"
        className="flex items-center gap-2"
        onClick={() => setIsOpen((p) => !p)}
      >
        <SlidersHorizontal size={16} />
        Filter
        {activeCount > 0 && (
          <span className="rounded-full bg-(--accent) px-1.5 py-0.5 text-xs text-(--accent-contrast)">
            {activeCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-(--border) bg-(--bg-elevated) p-4 shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-(--fg)">
              <Funnel size={16} />
              Filters
            </div>

            <Button
              variant="ghost"
              className="px-2 py-1 text-xs"
              onClick={resetFilters}
            >
              Reset
            </Button>
          </div>

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
              onChange={(e) =>
                setFilters({ onlyEmpty: e.target.checked })
              }
            />

            <Checkbox
              label="Opened in last 7 days"
              checked={filters.onlyRecentlyOpened}
              onChange={(e) =>
                setFilters({ onlyRecentlyOpened: e.target.checked })
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}