import type { ButtonHTMLAttributes, HTMLAttributes, ReactElement, ReactNode } from "react";

import Popover, { type PopoverContentProps } from "@/shared/components/ui/Popover";
import { usePopoverContext } from "@/shared/components/ui/Popover/context";
import { cn } from "@/shared/lib/ui/cn";

type MenuRootProps = {
  children: ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

function MenuRoot(props: MenuRootProps) {
  return <Popover.Root {...props} />;
}

function MenuTrigger({ children }: { children: ReactElement<any> }) {
  return <Popover.Trigger>{children}</Popover.Trigger>;
}

function MenuContent({
  align = "right",
  children,
  className,
  offset = 8,
  ...props
}: PopoverContentProps) {
  return (
    <Popover.Content
      align={align}
      className={cn("min-w-48 overflow-hidden py-1", className)}
      offset={offset}
      {...props}
    >
      {children}
    </Popover.Content>
  );
}

type MenuItemProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  danger?: boolean;
  keepOpen?: boolean;
};

function MenuItem({
  children,
  className,
  danger = false,
  keepOpen = false,
  onClick,
  ...props
}: MenuItemProps) {
  const { setOpen } = usePopoverContext("Menu.Item");

  return (
    <button
      type="button"
      className={cn(
        "mx-1 flex w-[calc(100%-0.5rem)] items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
        danger ? "text-red-600 hover:bg-red-50" : "text-(--fg) hover:bg-(--bg)",
        className,
      )}
      onClick={(event) => {
        onClick?.(event);

        if (!event.defaultPrevented && !keepOpen) {
          setOpen(false);
        }
      }}
      {...props}
    >
      {children}
    </button>
  );
}

function MenuLabel({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("px-4 py-2 text-xs font-semibold uppercase tracking-wide text-(--fg-muted)", className)}
      {...props}
    >
      {children}
    </div>
  );
}

function MenuSeparator({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("my-1 border-t border-(--border)", className)} {...props} />;
}

const Menu = Object.assign(MenuRoot, {
  Root: MenuRoot,
  Trigger: MenuTrigger,
  Content: MenuContent,
  Item: MenuItem,
  Label: MenuLabel,
  Separator: MenuSeparator,
});

export default Menu;
