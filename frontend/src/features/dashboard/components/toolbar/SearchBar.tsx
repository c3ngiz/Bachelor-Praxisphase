import { useEffect, useState } from "react";
import { Search } from "lucide-react";

import Input from "@/shared/components/ui/Input";
import { useDashboardStore } from "../../store/dashboardStore";

const DEBOUNCE_MS = 300;

export default function SearchBar() {
    const setSearchQuery = useDashboardStore((s) => s.setSearchQuery);
    const query = useDashboardStore((s) => s.searchQuery);

    const [localValue, setLocalValue] = useState(query);

    useEffect(() => {
        setLocalValue(query);
    }, [query]);

    useEffect(() => {
        const timeout = setTimeout(() => {
            setSearchQuery(localValue);
        }, DEBOUNCE_MS);

        return () => clearTimeout(timeout);
    }, [localValue, setSearchQuery]);

    return (
        <div className="relative w-full">
            <Search
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-(--fg-muted)"
            />

            <Input
                placeholder="Search documents..."
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
                className="h-12 rounded-full border-(--border) bg-(--bg-elevated) pl-11 pr-4 shadow-sm focus-visible:ring-2 focus-visible:ring-(--focus-ring)"
            />
        </div>
    );
}