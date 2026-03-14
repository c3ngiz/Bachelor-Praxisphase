import type { HTMLAttributes } from "react";

type Props = HTMLAttributes<HTMLDivElement> & {
    label?: string;
    vertical?: boolean;
};

export default function Divider({ label, vertical = false, className = "", ...props }: Props) {
    if (vertical) {
        return <div className={["h-full min-h-4 w-px bg-(--border)", className].join(" ")} aria-hidden="true" {...props} />;
    }

    if (!label) {
        return <div className={["h-px w-full bg-(--border)", className].join(" ")} aria-hidden="true" {...props} />;
    }

    return (
        <div className={["flex w-full items-center gap-3", className].join(" ")} role="separator" {...props}>
            <span className="h-px flex-1 bg-(--border)" aria-hidden="true" />
            <span className="text-xs uppercase tracking-wide text-(--fg-muted)">{label}</span>
            <span className="h-px flex-1 bg-(--border)" aria-hidden="true" />
        </div>
    );
}
