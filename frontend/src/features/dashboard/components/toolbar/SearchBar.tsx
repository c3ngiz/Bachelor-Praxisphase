import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";

import { useDashboardViewControls } from "../../hooks/useDashboardViewControls";

const DEBOUNCE_MS = 300;

/**
 * SearchBar component.
 */
export default function SearchBar() {
    const { setSearchQuery, searchQuery } = useDashboardViewControls();

    const [localValue, setLocalValue] = useState(searchQuery);
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
        setLocalValue(searchQuery);
    }, [searchQuery]);

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
        <div className="relative flex h-10 w-full items-center">
            <Search
                size={18}
                className={[
                    "pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-150",
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
                    h-10 w-full rounded-xl border border-(--border) bg-(--bg)
                    pl-10 pr-11 text-sm text-(--fg) placeholder:text-(--fg-muted)
                    shadow-[0_1px_2px_rgba(15,23,42,0.04)]
                    transition-[border-color,box-shadow,background-color] duration-150
                    hover:border-[color-mix(in_srgb,var(--border)_72%,var(--fg)_28%)]
                    focus:border-(--accent)
                    focus:bg-(--bg-elevated)
                    focus:shadow-[0_0_0_3px_var(--focus-ring),0_4px_14px_rgba(15,23,42,0.08)]
                    focus:outline-none
                "
            />

            {hasValue ? (
                <button
                    type="button"
                    onClick={handleClear}
                    aria-label="Clear search"
                    className="
                        absolute right-2.5 top-1/2 inline-flex h-7 w-7 -translate-y-1/2
                        items-center justify-center rounded-lg
                        text-(--fg-muted) transition-[background-color,color] duration-150
                        hover:bg-(--bg-secondary) hover:text-(--fg)
                        focus:outline-none focus:ring-2 focus:ring-(--focus-ring)
                    "
                >
                    <X size={16} />
                </button>
            ) : null}
        </div>
    );
}