import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

type Align = "left" | "right" | "center";

type Props = {
  trigger: (args: { open: boolean; toggle: () => void }) => ReactNode;
  children: (args: { close: () => void }) => ReactNode;
  className?: string;
  align?: Align;
  offset?: number;
};

export default function Popover({
  trigger,
  children,
  className,
  align = "right",
  offset = 8,
}: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  const close = () => setOpen(false);
  const toggle = () => setOpen((prev) => !prev);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) {
        close();
      }
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const alignClasses = {
    left: "left-0",
    right: "right-0",
    center: "left-1/2 -translate-x-1/2",
  }[align];

  return (
    <div className="relative" ref={ref}>
      {trigger({ open, toggle })}

      {open && (
        <div
          style={{ marginTop: offset }}
          className={[
            "absolute top-full z-50",
            alignClasses,

            // base styling
            "rounded-xl border border-(--border)",
            "bg-(--bg-elevated) shadow-xl",

            // animation
            "origin-top transform transition-all duration-150 ease-out",
            "scale-95 opacity-0 animate-popover-in",

            className,
          ].join(" ")}
        >
          {children({ close })}
        </div>
      )}
    </div>
  );
}