import Popover from "@/shared/components/ui/Popover";
import { Check, LayoutGrid, List, Rows3 } from "lucide-react";
import { useDashboardViewControls } from "../../hooks/useDashboardViewControls";

type ViewOption = {
    value: "grid" | "list";
    label: string;
    icon: typeof LayoutGrid;
};

const VIEW_OPTIONS: ViewOption[] = [
    { value: "grid", label: "Grid", icon: LayoutGrid },
    { value: "list", label: "List", icon: List },
];

function getCurrentViewLabel(viewMode: "grid" | "list") {
    return VIEW_OPTIONS.find((option) => option.value === viewMode)?.label ?? "View";
}

/**
 * ViewDropdown component.
 */
export default function ViewDropdown() {
    const { viewMode, setViewMode } = useDashboardViewControls();

    return (
        <Popover
            align="right"
            offset={10}
            className="w-52 rounded-xl border border-(--border) bg-(--bg-elevated) py-1 shadow-[0_10px_30px_rgba(15,23,42,0.10)]"
            trigger={({ toggle }) => (
                <button
                    type="button"
                    onClick={toggle}
                    className="
                        inline-flex h-9 w-27 items-center justify-center gap-2
                        rounded-lg px-3 text-sm font-medium text-(--fg)
                        transition-[background-color,color] duration-150
                        hover:bg-(--bg) active:bg-(--bg)
                    "
                    aria-label="Change view"
                >
                    <Rows3 size={16} />
                    <span className="truncate">{getCurrentViewLabel(viewMode)}</span>
                </button>
            )}
        >
            {({ close }) => (
                <div>
                    {VIEW_OPTIONS.map((option) => {
                        const Icon = option.icon;
                        const isActive = option.value === viewMode;

                        return (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => {
                                    setViewMode(option.value);
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