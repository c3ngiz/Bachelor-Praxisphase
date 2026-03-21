import { useEffect, useState } from "react";
import Input from "@/shared/components/ui/Input";
import { useDashboardStore } from "../store/dashboardStore";

const DEBOUNCE_MS = 300;

export default function SearchBar() {
    const setSearchQuery = useDashboardStore((s) => s.setSearchQuery);
    const query = useDashboardStore((s) => s.searchQuery);

    const [localValue, setLocalValue] = useState(query);

    useEffect(() => {
        const timeout = setTimeout(() => {
            setSearchQuery(localValue);
        }, DEBOUNCE_MS);

        return () => clearTimeout(timeout);
    }, [localValue, setSearchQuery]);

    return (
        <div className="w-full max-w-md">
            <Input
                placeholder="Search documents..."
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
            />
        </div>
    );
}