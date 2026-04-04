import Popover from "@/shared/components/ui/Popover";
import { ArrowDownAZ, CalendarRange, Check, Clock3 } from "lucide-react";
import { useDashboardStore } from "../../store/dashboardStore";

type SortOption = {
  value: "updated" | "created" | "title";
  label: string;
  icon: typeof Clock3;
};

const SORT_OPTIONS: SortOption[] = [
  { value: "updated", label: "Last updated", icon: Clock3 },
  { value: "created", label: "Created", icon: CalendarRange },
  { value: "title", label: "Title", icon: ArrowDownAZ },
];

function getCurrentSortLabel(sortBy: "updated" | "created" | "title") {
  return SORT_OPTIONS.find((option) => option.value === sortBy)?.label ?? "Sort";
}

export default function SortDropdown() {
  const sortBy = useDashboardStore((s) => s.sortBy);
  const setSortBy = useDashboardStore((s) => s.setSortBy);

  return (
    <Popover
      align="right"
      offset={10}
      className="w-56 rounded-xl border border-(--border) bg-(--bg-elevated) py-1 shadow-[0_10px_30px_rgba(15,23,42,0.10)]"
      trigger={({ toggle }) => (
        <button
          type="button"
          onClick={toggle}
          className="
                        inline-flex h-9 w-[10.75rem] items-center justify-center gap-2
                        rounded-lg px-3 text-sm font-medium text-(--fg)
                        transition-[background-color,color] duration-150
                        hover:bg-(--bg) active:bg-(--bg)
                    "
          aria-label="Sort documents"
        >
          <Clock3 size={16} />
          <span className="truncate">{getCurrentSortLabel(sortBy)}</span>
        </button>
      )}
    >
      {({ close }) => (
        <div>
          {SORT_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isActive = option.value === sortBy;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setSortBy(option.value);
                  close();
                }}
                className={[
                  "mx-1 flex w-[calc(100%-0.5rem)] items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-(--bg) text-(--fg)"
                    : "text-(--fg) hover:bg-(--bg)",
                ].join(" ")}
              >
                <span className="flex items-center gap-2">
                  <Icon size={16} />
                  {option.label}
                </span>

                {isActive ? (
                  <Check size={16} className="text-(--accent)" />
                ) : null}
              </button>
            );
          })}
        </div>
      )}
    </Popover>
  );
}