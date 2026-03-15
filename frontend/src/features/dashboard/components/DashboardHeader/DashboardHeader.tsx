import Divider from "@/shared/components/ui/Divider";
import SearchBar from "../SearchBar";
import ViewToggle from "../ViewToggle";

export default function DashboardHeader() {
    return (
        <header className="flex items-center justify-between gap-6 border-b border-(--border) bg-(--bg-elevated) px-6 py-4">
            {/* Title */}
            <div className="flex items-center gap-4">
                <h1 className="text-xl font-semibold text-(--fg)">
                    Documents
                </h1>

                <Divider vertical className="h-6" />
            </div>

            {/* Search */}
            <div className="flex flex-1 justify-center">
                <SearchBar />
            </div>

            {/* View toggle */}
            <div className="flex items-center">
                <ViewToggle />
            </div>
        </header>
    );
}