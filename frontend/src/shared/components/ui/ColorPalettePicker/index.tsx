import type { KeyboardEvent as ReactKeyboardEvent, ReactNode } from "react";

import Button from "../Button";
import Popover from "../Popover";
import { cn } from "@/shared/lib/ui/cn";

type Props = {
  ariaLabel: string;
  title: string;
  selectedColor: string;
  paletteColors: readonly string[];
  onSelectColor: (color: string) => void;
  triggerContent: ReactNode;
};

export default function ColorPalettePicker({
  ariaLabel,
  title,
  selectedColor,
  paletteColors,
  onSelectColor,
  triggerContent,
}: Props) {
  function onTriggerKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>) {
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      event.currentTarget.click();
    }
  }

  return (
    <Popover.Root>
      <Popover.Trigger>
        <Button
          variant="ghost"
          size="sm"
          iconOnly
          aria-label={ariaLabel}
          title={title}
          onKeyDown={onTriggerKeyDown}
          className="h-8 w-8 rounded-md border border-(--border) px-0 py-0 text-(--fg-muted)"
        >
          {triggerContent}
        </Button>
      </Popover.Trigger>

      <Popover.Content
        strategy="fixed"
        align="left"
        offset={8}
        className="w-61.5 p-3"
      >
        <div className="grid grid-cols-10 gap-1">
          {paletteColors.map((color) => {
            const isActive = selectedColor === color;

            return (
              <Popover.Close key={color}>
                <button
                  type="button"
                  aria-label={`${title} ${color}`}
                  onClick={() => onSelectColor(color)}
                  className={cn(
                    "h-5 w-5 rounded-full border transition",
                    color === "#ffffff" ? "border-(--border)" : "border-transparent",
                    isActive ? "ring-2 ring-(--accent) ring-offset-1" : "hover:scale-105",
                  )}
                  style={{ backgroundColor: color }}
                />
              </Popover.Close>
            );
          })}
        </div>
      </Popover.Content>
    </Popover.Root>
  );
}
