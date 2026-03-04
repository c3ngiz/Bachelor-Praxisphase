import type { ReactNode } from "react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
};

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
}: Props) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg p-6 w-105"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between mb-4">
          {title && (
            <h2 className="text-lg font-semibold">
              {title}
            </h2>
          )}

          <button onClick={onClose}>✕</button>
        </div>

        {children}
      </div>
    </div>
  );
}