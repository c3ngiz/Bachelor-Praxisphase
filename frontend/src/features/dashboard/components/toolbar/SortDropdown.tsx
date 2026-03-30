import { Button } from "@/shared/components/ui";
import Popover from "@/shared/components/ui/Popover";
import { ArrowDownAZ, CalendarRange, Check, Clock3 } from "lucide-react";
import { useDashboardStore } from "../../store/dashboardStore";

type SortOption = {
  value: "updated" | "created" | "title";
  label: string;
  icon: typeof Clock3;
};

const SORT_OPTIONS: SortOption[] = [
  {
    value: "updated",
    label: "Last updated",
    icon: Clock3,
  },
  {
    value: "created",
    label: "Created",
    icon: CalendarRange,
  },
  {
    value: "title",
    label: "Title",
    icon: ArrowDownAZ,
  },
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
      className="w-56 py-1"
      trigger={({ toggle }) => (
        <Button
          variant="ghost"
          className="flex items-center gap-2"
          onClick={toggle}
        >
          <Clock3 size={16} />
          {getCurrentSortLabel(sortBy)}
        </Button>
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
                onClick={() => {
                  setSortBy(option.value);
                  close();
                }}
                className="flex w-full items-center justify-between gap-3 px-4 py-2 text-sm hover:bg-(--bg)"
              >
                <span className="flex items-center gap-2 text-(--fg)">
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