import Button from "@/shared/components/ui/Button";
import { useDashboardStore } from "../store/dashboardStore";

export default function ViewToggle() {
    const viewMode = useDashboardStore((s) => s.viewMode);
    const setViewMode = useDashboardStore((s) => s.setViewMode);

    return (
        <div className="flex items-center gap-2">
            <Button
                variant={viewMode === "grid" ? "primary" : "ghost"}
                onClick={() => setViewMode("grid")}
            >
                Grid
            </Button>

            <Button
                variant={viewMode === "list" ? "primary" : "ghost"}
                onClick={() => setViewMode("list")}
            >
                List
            </Button>
        </div>
    );
}