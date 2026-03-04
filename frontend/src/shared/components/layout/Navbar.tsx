import { NavLink } from "react-router-dom";

export default function Navbar() {
  return (
    <header className="border-b border-(--border) bg-(--bg-elevated)">
      <nav className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
        <NavLink to="/dashboard" className="text-base font-semibold text-(--fg)">
          Bachelor Praxisphase
        </NavLink>

        <div className="flex items-center gap-2">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              [
                "rounded-md px-3 py-1.5 text-sm transition-colors",
                isActive
                  ? "bg-(--accent) text-(--accent-contrast)"
                  : "text-(--fg-muted) hover:text-(--fg)",
              ].join(" ")
            }
          >
            Dashboard
          </NavLink>
        </div>
      </nav>
    </header>
  );
}