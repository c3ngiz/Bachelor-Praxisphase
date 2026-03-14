import type { InputHTMLAttributes } from "react";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
    label?: string;
    error?: string;
};

export default function Checkbox({ label, error, className = "", id, ...props }: Props) {
    const checkboxId = id ?? props.name;

    return (
        <div className="w-full space-y-1.5">
            <label htmlFor={checkboxId} className="inline-flex items-start gap-2 text-sm text-(--fg)">
                <input
                    id={checkboxId}
                    type="checkbox"
                    className={[
                        "mt-0.5 h-4 w-4 rounded border-(--border) bg-(--bg-elevated) text-(--accent)",
                        "focus:ring-2 focus:ring-(--accent) focus:ring-offset-0 focus:outline-none",
                        className,
                    ].join(" ")}
                    {...props}
                />
                {label ? <span>{label}</span> : null}
            </label>

            {error ? <p className="text-xs text-red-500">{error}</p> : null}
        </div>
    );
}
