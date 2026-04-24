import { Menu } from "@/shared/components/ui";
import { ArrowDownAZ, CalendarRange, Check, Clock3 } from "lucide-react";
import { useDashboardViewControls } from "../../hooks/useDashboardViewControls";

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

/**
 * SortDropdown component.
 */
export default function SortDropdown() {
  const { sortBy, setSortBy } = useDashboardViewControls();

  return (
    <Menu.Root>
      <Menu.Trigger>
        <button
          type="button"
          className="
                        inline-flex h-10 w-43 items-center justify-center gap-2
                        rounded-xl border border-(--border) bg-white px-3
                        text-sm font-semibold text-(--fg)
                        shadow-sm transition-[background-color,border-color,color] duration-150
                        hover:border-(--accent) hover:text-(--accent)
                    "
          aria-label="Sort documents"
        >
          <Clock3 size={16} />
          <span className="truncate">{getCurrentSortLabel(sortBy)}</span>
        </button>
      </Menu.Trigger>

      <Menu.Content className="w-56">
        <div>
          {SORT_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isActive = option.value === sortBy;

            return (
              <Menu.Item
                key={option.value}
                onClick={() => {
                  setSortBy(option.value);
                }}
                className={[
                  "justify-between",
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
              </Menu.Item>
            );
          })}
        </div>
      </Menu.Content>
    </Menu.Root>
  );
}
