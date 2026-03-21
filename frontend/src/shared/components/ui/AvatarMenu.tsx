import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

type MenuItem = {
  label: string;
  onClick: () => void;
  danger?: boolean;
  icon?: ReactNode;
};

type Props = {
  avatar?: ReactNode;
  items: MenuItem[];
};

export default function AvatarMenu({ avatar, items }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-(--bg) border border-(--border) hover:bg-(--bg-elevated)"
      >
        {avatar ?? <span className="text-sm font-medium">U</span>}
      </button>

      {isOpen && (
        <div
          className="
            absolute right-0 mt-2 w-48
            rounded-xl border border-(--border)
            bg-(--bg-elevated)
            shadow-lg
            overflow-hidden
            z-50
          "
        >
          {items.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                item.onClick();
                setIsOpen(false);
              }}
              className={[
                "w-full text-left px-4 py-2 text-sm flex items-center gap-2",
                "hover:bg-(--bg)",
                item.danger ? "text-red-600" : "text-(--fg)",
              ].join(" ")}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}