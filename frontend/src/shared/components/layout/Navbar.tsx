import type { ReactNode } from "react";

type Props = {
  left?: ReactNode;
  center?: ReactNode;
  right?: ReactNode;
};

export default function Navbar({ left, center, right }: Props) {
  return (
    <header className="w-full border-b border-(--border) bg-(--bg-elevated)">
      <nav className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between px-6">
        <div className="flex min-w-0 items-center gap-4">
          {left}
        </div>

        <div className="flex flex-1 items-center justify-center px-6">
          {center}
        </div>

        <div className="flex min-w-0 items-center gap-3">
          {right}
        </div>
      </nav>
    </header>
  );
}