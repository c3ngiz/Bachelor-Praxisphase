import type { SelectHTMLAttributes } from "react";

type SelectOption = {
    value: string;
    label: string;
    disabled?: boolean;
};

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
    label?: string;
    error?: string;
    options?: SelectOption[];
    placeholder?: string;
};

export default function Select({
    label,
    error,
    className = "",
    id,
    options,
    placeholder,
    children,
    ...props
}: Props) {
    const selectId = id ?? props.name;

    return (
        <div className="w-full space-y-1.5">
            {label ? (
                <label htmlFor={selectId} className="block text-sm font-medium text-(--fg)">
                    {label}
                </label>
            ) : null}

            <div className="relative">
                <select
                    id={selectId}
                    className={[
                        "w-full appearance-none rounded-lg border bg-(--bg-elevated) px-3 py-2 pr-9 text-sm text-(--fg)",
                        "border-(--border) focus:border-(--accent) focus:outline-none",
                        "disabled:cursor-not-allowed disabled:opacity-60",
                        className,
                    ].join(" ")}
                    {...props}
                >
                    {placeholder ? (
                        <option value="" disabled>
                            {placeholder}
                        </option>
                    ) : null}

                    {options?.map((option) => (
                        <option key={option.value} value={option.value} disabled={option.disabled}>
                            {option.label}
                        </option>
                    ))}

                    {children}
                </select>

                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-(--fg-muted)" aria-hidden="true">
                    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                </span>
            </div>

            {error ? <p className="text-xs text-red-500">{error}</p> : null}
        </div>
    );
}
