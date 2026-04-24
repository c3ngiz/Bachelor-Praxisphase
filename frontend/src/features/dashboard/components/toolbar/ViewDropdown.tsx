import { SegmentedControl } from "@/shared/components/ui";
import { LayoutGrid, List } from "lucide-react";
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

/**
 * ViewDropdown component.
 */
export default function ViewDropdown() {
    const { viewMode, setViewMode } = useDashboardViewControls();

    return (
        <SegmentedControl
            ariaLabel="Change document view"
            value={viewMode}
            onChange={setViewMode}
            options={VIEW_OPTIONS.map((option) => {
                const Icon = option.icon;

                return {
                    value: option.value,
                    label: option.label,
                    icon: <Icon size={15} />,
                };
            })}
        />
    );
}
