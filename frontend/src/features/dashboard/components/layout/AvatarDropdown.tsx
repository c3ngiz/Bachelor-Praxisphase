import { useNavigate } from "react-router-dom";
import {
  CreditCard,
  HelpCircle,
  LogOut,
  Settings,
  User,
} from "lucide-react";

import { Avatar, Popover } from "@/shared/components/ui";
import { useAuth } from "@/features/auth";

/**
 * AvatarDropdown component.
 */
export default function AvatarDropdown() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const initials = user?.initials || user?.name?.charAt(0)?.toUpperCase() || "?";

  function handleLogout() {
    logout();
    navigate("/signin");
  }

  return (
    <Popover.Root>
      <Popover.Trigger>
        <button
          type="button"
          aria-label="User menu"
          className={[
            "inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15",
            "text-sm font-semibold transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-(--focus-ring)",
            "bg-[#31b6d8] text-white hover:bg-[#49c4e1]",
          ].join(" ")}
        >
          {initials}
        </button>
      </Popover.Trigger>

      <Popover.Content align="right" offset={10} className="w-72 overflow-hidden p-0">
        <div>
          <div className="border-b border-(--border) px-4 py-4">
            <div className="flex items-center gap-3">
              <Avatar
                initials={initials}
                alt={user?.name ?? "User"}
                size="lg"
                className="border border-(--border) bg-(--bg) text-(--fg)"
              />

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-(--fg)">
                  {user?.name ?? "User"}
                </p>
                <p className="truncate text-xs text-(--fg-muted)">
                  {user?.email ?? "Workspace member"}
                </p>
              </div>
            </div>
          </div>

          <div className="p-2">
            <Popover.Close>
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-(--fg) transition-colors hover:bg-(--bg)"
              >
                <User size={16} />
                Profile
              </button>
            </Popover.Close>

            <Popover.Close>
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-(--fg) transition-colors hover:bg-(--bg)"
              >
                <Settings size={16} />
                Settings
              </button>
            </Popover.Close>

            <Popover.Close>
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-(--fg) transition-colors hover:bg-(--bg)"
              >
                <CreditCard size={16} />
                Billing
              </button>
            </Popover.Close>

            <Popover.Close>
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-(--fg) transition-colors hover:bg-(--bg)"
              >
                <HelpCircle size={16} />
                Help & support
              </button>
            </Popover.Close>
          </div>

          <div className="border-t border-(--border) p-2">
            <Popover.Close>
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
              >
                <LogOut size={16} />
                Log out
              </button>
            </Popover.Close>
          </div>
        </div>
      </Popover.Content>
    </Popover.Root>
  );
}
