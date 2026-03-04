import { useEffect, type ReactNode } from "react";
import Button from "./Button";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
};

export default function Modal({ isOpen, onClose, title, children }: Props) {
  useEffect(() => {
    if (!isOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-md rounded-xl border border-(--border) bg-(--bg-elevated) p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title ?? "Modal"}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-(--fg)">{title}</h3>
          <Button variant="ghost" className="px-2 py-1" onClick={onClose} aria-label="Close modal">
            ✕
          </Button>
        </div>

        <div className="space-y-4">{children}</div>
      </div>
    </div>
  );
}