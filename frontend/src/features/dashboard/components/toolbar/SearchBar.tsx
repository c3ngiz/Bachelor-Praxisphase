import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";

import { useDashboardStore } from "../../store/dashboardStore";

const DEBOUNCE_MS = 300;

export default function SearchBar() {
    const setSearchQuery = useDashboardStore((s) => s.setSearchQuery);
    const query = useDashboardStore((s) => s.searchQuery);

    const [localValue, setLocalValue] = useState(query);
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
        setLocalValue(query);
    }, [query]);

    useEffect(() => {
        const timeout = setTimeout(() => {
            setSearchQuery(localValue);
        }, DEBOUNCE_MS);

        return () => clearTimeout(timeout);
    }, [localValue, setSearchQuery]);

    function handleClear() {
        setLocalValue("");
        setSearchQuery("");
    }

    const hasValue = localValue.trim().length > 0;

    return (
        <div className="relative flex h-11 w-full items-center">
            <Search
                size={18}
                className={[
                    "pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-150",
                    isFocused ? "text-(--fg)" : "text-(--fg-muted)",
                ].join(" ")}
            />

            <input
                type="text"
                placeholder="Search documents..."
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                className="
                    h-11 w-full rounded-xl border border-(--border) bg-(--bg-elevated)
                    pl-11 pr-12 text-sm text-(--fg) placeholder:text-(--fg-muted)
                    shadow-[0_2px_8px_rgba(60,64,67,0.08)]
                    transition-[border-color,box-shadow,background-color] duration-150
                    hover:border-[color:color-mix(in_srgb,var(--border)_72%,var(--fg)_28%)]
                    focus:border-(--accent)
                    focus:bg-(--bg-elevated)
                    focus:shadow-[0_0_0_3px_var(--focus-ring),0_6px_16px_rgba(60,64,67,0.12)]
                    focus:outline-none
                "
            />

            {hasValue ? (
                <button
                    type="button"
                    onClick={handleClear}
                    aria-label="Clear search"
                    className="
                        absolute right-3 top-1/2 inline-flex h-7 w-7 -translate-y-1/2
                        items-center justify-center rounded-lg
                        text-(--fg-muted) transition-[background-color,color] duration-150
                        hover:bg-(--bg) hover:text-(--fg)
                        focus:outline-none focus:ring-2 focus:ring-(--focus-ring)
                    "
                >
                    <X size={16} />
                </button>
            ) : null}
        </div>
    );
}