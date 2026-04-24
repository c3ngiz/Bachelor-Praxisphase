import {
  cloneElement,
  isValidElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type MouseEvent as ReactMouseEvent,
  type ReactElement,
  type ReactNode,
} from "react";

import {
  PopoverContext,
  type PopoverAlign,
  type PopoverSide,
  type PopoverStrategy,
  usePopoverContext,
} from "./context";
import { cn } from "@/shared/lib/ui/cn";

type PopoverRootProps = {
  children: ReactNode;
  className?: string;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

function PopoverRoot({
  children,
  className,
  defaultOpen = false,
  open: controlledOpen,
  onOpenChange,
}: PopoverRootProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const triggerRef = useRef<HTMLElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const setOpen = useCallback(
    (next: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(next);
      }

      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );

  const toggle = useCallback(() => {
    setOpen(!open);
  }, [open, setOpen]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;

      if (triggerRef.current?.contains(target)) {
        return;
      }

      if (contentRef.current?.contains(target)) {
        return;
      }

      setOpen(false);
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [open, setOpen]);

  const value = useMemo(
    () => ({
      contentRef,
      open,
      setOpen,
      toggle,
      triggerRef,
    }),
    [open, setOpen, toggle],
  );

  return (
    <PopoverContext.Provider value={value}>
      <div className={cn("relative", className)}>{children}</div>
    </PopoverContext.Provider>
  );
}

type PopoverTriggerProps = {
  children: ReactElement<TriggerChildProps & Record<string, unknown>>;
};

type TriggerChildProps = {
  onClick?: (event: ReactMouseEvent<HTMLElement>) => void;
  "aria-expanded"?: boolean;
  "aria-haspopup"?: boolean | "menu" | "dialog";
};

function PopoverTrigger({ children }: PopoverTriggerProps) {
  const { open, toggle, triggerRef } = usePopoverContext("Popover.Trigger");

  if (!isValidElement(children)) {
    throw new Error("Popover.Trigger expects a single valid React element child");
  }

  const triggerChild = children as ReactElement<TriggerChildProps>;

  return (
    <span ref={triggerRef as React.MutableRefObject<HTMLSpanElement | null>} className="inline-flex">
      {cloneElement(triggerChild, {
        "aria-expanded": open,
        "aria-haspopup": triggerChild.props["aria-haspopup"] ?? "dialog",
        onClick: (event: ReactMouseEvent<HTMLElement>) => {
          triggerChild.props.onClick?.(event);
          if (!event.defaultPrevented) {
            toggle();
          }
        },
      })}
    </span>
  );
}

export type PopoverContentProps = HTMLAttributes<HTMLDivElement> & {
  align?: PopoverAlign;
  children: ReactNode;
  offset?: number;
  sameWidth?: boolean;
  side?: PopoverSide;
  strategy?: PopoverStrategy;
};

function getFixedPositionStyle(
  triggerRect: DOMRect,
  align: PopoverAlign,
  side: PopoverSide,
  offset: number,
): CSSProperties {
  const baseTop = side === "bottom" ? triggerRect.bottom + offset : triggerRect.top - offset;
  const style: CSSProperties = {
    position: "fixed",
  };

  if (side === "bottom") {
    style.top = baseTop;
  } else {
    style.bottom = window.innerHeight - triggerRect.top + offset;
  }

  if (align === "left") {
    style.left = triggerRect.left;
  } else if (align === "right") {
    style.left = triggerRect.right;
  } else {
    style.left = triggerRect.left + triggerRect.width / 2;
    style.transform = "translateX(-50%)";
  }

  return style;
}

function PopoverContent({
  align = "right",
  children,
  className,
  offset = 8,
  sameWidth = false,
  side = "bottom",
  strategy = "absolute",
  style,
  ...props
}: PopoverContentProps) {
  const { contentRef, open, triggerRef } = usePopoverContext("Popover.Content");
  const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const updatePosition = () => {
      if (!triggerRef.current) {
        return;
      }

      setTriggerRect(triggerRef.current.getBoundingClientRect());
    };

    updatePosition();

    if (strategy === "fixed" || sameWidth) {
      window.addEventListener("resize", updatePosition);
      window.addEventListener("scroll", updatePosition, true);

      return () => {
        window.removeEventListener("resize", updatePosition);
        window.removeEventListener("scroll", updatePosition, true);
      };
    }

    return;
  }, [open, sameWidth, strategy, triggerRef]);

  if (!open) {
    return null;
  }

  const absoluteClasses =
    strategy === "absolute"
      ? {
          left: side === "bottom" ? "left-0 top-full" : "bottom-full left-0",
          right: side === "bottom" ? "right-0 top-full" : "bottom-full right-0",
          center:
            side === "bottom"
              ? "left-1/2 top-full -translate-x-1/2"
              : "bottom-full left-1/2 -translate-x-1/2",
        }[align]
      : "";

  const computedStyle: CSSProperties =
    strategy === "fixed" && triggerRect
      ? {
          ...getFixedPositionStyle(triggerRect, align, side, offset),
          ...(align === "right"
            ? { transform: "translateX(-100%)" }
            : null),
          ...(sameWidth ? { minWidth: triggerRect.width } : null),
          ...style,
        }
      : {
          ...(side === "bottom"
            ? { marginTop: offset }
            : { marginBottom: offset }),
          ...(sameWidth && triggerRect ? { minWidth: triggerRect.width } : null),
          ...style,
        };

  return (
    <div
      ref={contentRef}
      className={cn(
        strategy === "fixed" ? "z-50" : "absolute z-50",
        absoluteClasses,
        "origin-top rounded-xl border border-(--border) bg-(--bg-elevated) shadow-xl",
        "animate-popover-in transition-all duration-150 ease-out",
        className,
      )}
      style={computedStyle}
      {...props}
    >
      {children}
    </div>
  );
}

function PopoverClose({
  children,
}: {
  children: ReactElement<{
    onClick?: (event: ReactMouseEvent<HTMLElement>) => void;
  }>;
}) {
  const { setOpen } = usePopoverContext("Popover.Close");

  if (!isValidElement(children)) {
    throw new Error("Popover.Close expects a single valid React element child");
  }

  return cloneElement(children, {
    onClick: (event: ReactMouseEvent<HTMLElement>) => {
      children.props.onClick?.(event);

      if (!event.defaultPrevented) {
        setOpen(false);
      }
    },
  });
}

const Popover = Object.assign(PopoverRoot, {
  Close: PopoverClose,
  Root: PopoverRoot,
  Trigger: PopoverTrigger,
  Content: PopoverContent,
});

export default Popover;
