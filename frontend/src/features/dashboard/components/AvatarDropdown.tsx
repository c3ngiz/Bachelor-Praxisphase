import { useNavigate } from "react-router-dom";
import {
  CreditCard,
  HelpCircle,
  LogOut,
  Settings,
  User,
} from "lucide-react";

import Popover from "@/shared/components/ui/Popover";

export default function AvatarDropdown() {
  const navigate = useNavigate();

  function handleLogout() {
    navigate("/signin");
  }

  return (
    <Popover
      align="right"
      offset={10}
      className="w-72 overflow-hidden"
      trigger={({ toggle, open }) => (
        <button
          type="button"
          onClick={toggle}
          aria-label="User menu"
          aria-expanded={open}
          className={[
            "inline-flex h-9 w-9 items-center justify-center rounded-full border border-(--border)",
            "text-sm font-semibold transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-(--focus-ring)",
            open
              ? "bg-(--bg-secondary) text-(--fg)"
              : "bg-(--bg) text-(--fg) hover:bg-(--bg-secondary)",
          ].join(" ")}
        >
          U
        </button>
      )}
    >
      {({ close }) => (
        <div>
          <div className="border-b border-(--border) px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-(--border) bg-(--bg) text-sm font-semibold text-(--fg)">
                U
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-(--fg)">
                  You
                </p>
                <p className="truncate text-xs text-(--fg-muted)">
                  Personal workspace
                </p>
              </div>
            </div>
          </div>

          <div className="p-2">
            <button
              type="button"
              onClick={close}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-(--fg) transition-colors hover:bg-(--bg)"
            >
              <User size={16} />
              Profile
            </button>

            <button
              type="button"
              onClick={close}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-(--fg) transition-colors hover:bg-(--bg)"
            >
              <Settings size={16} />
              Settings
            </button>

            <button
              type="button"
              onClick={close}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-(--fg) transition-colors hover:bg-(--bg)"
            >
              <CreditCard size={16} />
              Billing
            </button>

            <button
              type="button"
              onClick={close}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-(--fg) transition-colors hover:bg-(--bg)"
            >
              <HelpCircle size={16} />
              Help & support
            </button>
          </div>

          <div className="border-t border-(--border) p-2">
            <button
              type="button"
              onClick={() => {
                close();
                handleLogout();
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
            >
              <LogOut size={16} />
              Log out
            </button>
          </div>
        </div>
      )}
    </Popover>
  );
}