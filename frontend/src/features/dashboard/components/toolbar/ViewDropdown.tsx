import { Button } from "@/shared/components/ui";
import Popover from "@/shared/components/ui/Popover";
import { Check, LayoutGrid, List, Rows3 } from "lucide-react";
import { useDashboardStore } from "../../store/dashboardStore";

type ViewOption = {
    value: "grid" | "list";
    label: string;
    icon: typeof LayoutGrid;
};

const VIEW_OPTIONS: ViewOption[] = [
    {
        value: "grid",
        label: "Grid",
        icon: LayoutGrid,
    },
    {
        value: "list",
        label: "List",
        icon: List,
    },
];

function getCurrentViewLabel(viewMode: "grid" | "list") {
    return VIEW_OPTIONS.find((option) => option.value === viewMode)?.label ?? "View";
}

export default function ViewDropdown() {
    const viewMode = useDashboardStore((s) => s.viewMode);
    const setViewMode = useDashboardStore((s) => s.setViewMode);

    return (
        <Popover
            align="right"
            offset={10}
            className="w-52 py-1"
            trigger={({ toggle }) => (
                <Button
                    variant="ghost"
                    className="flex items-center gap-2"
                    onClick={toggle}
                >
                    <Rows3 size={16} />
                    {getCurrentViewLabel(viewMode)}
                </Button>
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
                                onClick={() => {
                                    setViewMode(option.value);
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