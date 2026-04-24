import { Menu } from "@/shared/components/ui";
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
        <Menu.Root>
            <Menu.Trigger>
                <button
                    type="button"
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
            </Menu.Trigger>

            <Menu.Content className="w-52">
                <div>
                    {VIEW_OPTIONS.map((option) => {
                        const Icon = option.icon;
                        const isActive = option.value === viewMode;

                        return (
                            <Menu.Item
                                key={option.value}
                                onClick={() => {
                                    setViewMode(option.value);
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
