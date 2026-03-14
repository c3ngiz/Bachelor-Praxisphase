import type { TextareaHTMLAttributes } from "react";

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & {
    label?: string;
    error?: string;
};

export default function Textarea({ label, error, className = "", id, ...props }: Props) {
    const textareaId = id ?? props.name;

    return (
        <div className="w-full space-y-1.5">
            {label ? (
                <label htmlFor={textareaId} className="block text-sm font-medium text-(--fg)">
                    {label}
                </label>
            ) : null}

            <textarea
                id={textareaId}
                className={[
                    "w-full min-h-24 rounded-lg border bg-(--bg-elevated) px-3 py-2 text-sm text-(--fg)",
                    "placeholder:text-(--fg-muted)",
                    "border-(--border) focus:border-(--accent) focus:outline-none",
                    "resize-y",
                    className,
                ].join(" ")}
                {...props}
            />

            {error ? <p className="text-xs text-red-500">{error}</p> : null}
        </div>
    );
}
