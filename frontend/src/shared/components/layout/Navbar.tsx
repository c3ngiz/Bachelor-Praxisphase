import type { ReactNode } from "react";

type Props = {
  left?: ReactNode;
  center?: ReactNode;
  right?: ReactNode;
};

export default function Navbar({ left, center, right }: Props) {
  return (
    <header className="w-full border-b border-(--border) bg-(--bg-elevated)">
      <nav className="flex h-14 w-full items-center justify-between px-6">

        {/* LEFT */}
        <div className="flex items-center gap-3">
          {left}
        </div>

        {/* CENTER */}
        <div className="flex items-center justify-center flex-1">
          {center}
        </div>

        {/* RIGHT */}
        <div className="flex items-center gap-3">
          {right}
        </div>

      </nav>
    </header>
  );
}