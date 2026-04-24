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
                    isFocused ? "text-white" : "text-white/55",
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
                    h-10 w-full rounded-xl border border-white/12 bg-white/8
                    pl-10 pr-11 text-sm text-white placeholder:text-white/48
                    shadow-[0_1px_2px_rgba(15,23,42,0.16)]
                    transition-[border-color,box-shadow,background-color] duration-150
                    hover:border-white/22 hover:bg-white/11
                    focus:border-white/32
                    focus:bg-white/12
                    focus:shadow-[0_0_0_3px_rgba(255,255,255,0.10),0_4px_14px_rgba(15,23,42,0.22)]
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
                        text-white/60 transition-[background-color,color] duration-150
                        hover:bg-white/10 hover:text-white
                        focus:outline-none focus:ring-2 focus:ring-(--focus-ring)
                    "
                >
                    <X size={16} />
                </button>
            ) : null}
        </div>
    );
}
