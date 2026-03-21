import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Checkbox, Select } from "@/shared/components/ui";
import { Funnel, Plus, Search, SlidersHorizontal } from "lucide-react";

import { useDocumentsStore } from "../store/documentsStore";
import { useDashboardStore } from "../store/dashboardStore";
import ViewToggle from "./ViewToggle";

type Props = {
  onCreate: () => void;
};

export default function DashboardToolbar({ onCreate }: Props) {
  const documents = useDocumentsStore((s) => s.documents);

  const searchQuery = useDashboardStore((s) => s.searchQuery);
  const setSearchQuery = useDashboardStore((s) => s.setSearchQuery);

  const sortBy = useDashboardStore((s) => s.sortBy);
  const setSortBy = useDashboardStore((s) => s.setSortBy);

  const filters = useDashboardStore((s) => s.filters);
  const setFilters = useDashboardStore((s) => s.setFilters);
  const resetFilters = useDashboardStore((s) => s.resetFilters);

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement | null>(null);

  const authorOptions = useMemo(() => {
    const authors = Array.from(new Set(documents.map((doc) => doc.author))).sort();

    return [
      { value: "all", label: "All authors" },
      ...authors.map((author) => ({
        value: author,
        label: author,
      })),
    ];
  }, [documents]);

  const activeFilterCount =
    (filters.author !== "all" ? 1 : 0) +
    (filters.onlyEmpty ? 1 : 0) +
    (filters.onlyRecentlyOpened ? 1 : 0);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!filterRef.current) return;
      if (!filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsFilterOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div className="flex items-center gap-4">
      <Button onClick={onCreate} className="flex items-center gap-2">
        <Plus size={16} />
        New
      </Button>

      <div className="flex flex-1 justify-center">
        <div className="relative w-full max-w-xl">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-(--fg-muted)"
          />

          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents..."
            className="
              w-full rounded-lg border border-(--border)
              bg-(--bg-elevated)
              py-2 pl-9 pr-3 text-sm text-(--fg)
              placeholder:text-(--fg-muted)
              outline-none focus:border-(--accent)
            "
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="min-w-44">
          <Select
            value={sortBy}
            onChange={(e) =>
              setSortBy(e.target.value as "updated" | "created" | "title")
            }
            options={[
              { value: "updated", label: "Last updated" },
              { value: "created", label: "Created" },
              { value: "title", label: "Title" },
            ]}
          />
        </div>

        <div className="relative" ref={filterRef}>
          <Button
            variant="ghost"
            className="flex items-center gap-2"
            onClick={() => setIsFilterOpen((prev) => !prev)}
          >
            <SlidersHorizontal size={16} />
            Filter
            {activeFilterCount > 0 ? (
              <span className="rounded-full bg-(--accent) px-1.5 py-0.5 text-xs text-(--accent-contrast)">
                {activeFilterCount}
              </span>
            ) : null}
          </Button>

          {isFilterOpen ? (
            <div
              className="
                absolute right-0 top-full z-50 mt-2 w-80
                rounded-xl border border-(--border)
                bg-(--bg-elevated) p-4 shadow-xl
              "
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-(--fg)">
                  <Funnel size={16} />
                  Filters
                </div>

                <Button
                  variant="ghost"
                  className="px-2 py-1 text-xs"
                  onClick={() => resetFilters()}
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
                  label="Opened in the last 7 days"
                  checked={filters.onlyRecentlyOpened}
                  onChange={(e) =>
                    setFilters({ onlyRecentlyOpened: e.target.checked })
                  }
                />
              </div>
            </div>
          ) : null}
        </div>

        <ViewToggle />
      </div>
    </div>
  );
}