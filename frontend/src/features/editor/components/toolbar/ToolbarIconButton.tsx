import type { LucideIcon } from "lucide-react";
import Button from "@/shared/components/ui/Button";

type Props = {
    isActive: boolean;
    label: string;
    onPress: () => void;
    icon: LucideIcon;
};

export default function ToolbarIconButton({ isActive, label, onPress, icon: Icon }: Props) {
    return (
        <Button
            variant="ghost"
            aria-label={label}
            title={label}
            onMouseDown={(event) => {
                event.preventDefault();
                onPress();
            }}
            className={[
                "h-9 w-9 rounded-md border px-0 py-0",
                isActive ? "border-(--accent) bg-(--accent)/10 text-(--accent)" : "border-(--border) text-(--fg-muted)",
            ].join(" ")}
        >
            <Icon className="h-4 w-4 shrink-0" strokeWidth={2.2} aria-hidden="true" />
        </Button>
    );
}
