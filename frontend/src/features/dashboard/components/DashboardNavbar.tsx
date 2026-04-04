import { Bell } from "lucide-react";

import SearchBar from "./toolbar/SearchBar";

export default function DashboardNavbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-(--border) bg-(--bg-elevated)/95 backdrop-blur supports-[backdrop-filter]:bg-(--bg-elevated)/88">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-4 px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="h-7 w-7 rounded-lg bg-(--accent)" />
          <span className="text-xl font-semibold tracking-tight text-(--fg)">
            CollabDocs
          </span>
        </div>

        <div className="flex flex-1 justify-center px-2">
          <div className="w-full max-w-[30rem]">
            <SearchBar />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Notifications"
            className="
              inline-flex h-9 w-9 items-center justify-center rounded-lg
              text-(--fg-muted) transition-colors duration-150
              hover:bg-(--bg) hover:text-(--fg)
              focus:outline-none focus:ring-2 focus:ring-(--focus-ring)
            "
          >
            <Bell size={18} />
          </button>

          <button
            type="button"
            aria-label="User menu"
            className="
              inline-flex h-9 w-9 items-center justify-center rounded-full
              border border-(--border) bg-(--bg)
              text-sm font-semibold text-(--fg)
              transition-colors duration-150
              hover:bg-(--bg-secondary)
              focus:outline-none focus:ring-2 focus:ring-(--focus-ring)
            "
          >
            U
          </button>
        </div>
      </div>
    </header>
  );
}