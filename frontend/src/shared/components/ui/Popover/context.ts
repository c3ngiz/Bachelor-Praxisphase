import { createContext, useContext, type MutableRefObject } from "react";

export type PopoverAlign = "left" | "right" | "center";
export type PopoverSide = "top" | "bottom";
export type PopoverStrategy = "absolute" | "fixed";

export type PopoverContextValue = {
  contentRef: MutableRefObject<HTMLDivElement | null>;
  open: boolean;
  setOpen: (next: boolean) => void;
  toggle: () => void;
  triggerRef: MutableRefObject<HTMLElement | null>;
};

export const PopoverContext = createContext<PopoverContextValue | null>(null);

export function usePopoverContext(part: string) {
  const context = useContext(PopoverContext);

  if (!context) {
    throw new Error(`${part} must be used within Popover.Root`);
  }

  return context;
}
