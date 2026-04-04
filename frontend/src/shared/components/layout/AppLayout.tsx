import { Outlet, Link } from "react-router-dom";
import { Bell } from "lucide-react";

import AvatarMenu from "@/shared/components/ui/AvatarMenu";
import Navbar from "./Navbar";
import useAuthContext from "@/features/auth/hooks/useAuthContext";

export default function AppLayout() {
  const { logout } = useAuthContext();

  return (
    <div className="min-h-screen flex flex-col bg-(--bg) text-(--fg)">
      <Navbar
        left={
          <Link
            to="/dashboard"
            className="flex items-center gap-3 text-(--fg)"
          >
            <div className="h-7 w-7 rounded-md bg-(--accent)" />

            <span className="text-lg font-semibold tracking-tight transition-colors hover:text-(--accent-hover)">
              CollabDocs
            </span>
          </Link>
        }
        right={
          <>
            <button
              type="button"
              aria-label="Notifications"
              className="
                inline-flex h-10 w-10 items-center justify-center
                rounded-full text-(--fg-muted)
                transition-colors hover:bg-(--bg) hover:text-(--fg)
              "
            >
              <Bell size={18} />
            </button>

            <AvatarMenu
              items={[
                {
                  label: "Profile",
                  onClick: () => console.log("Profile"),
                },
                {
                  label: "Settings",
                  onClick: () => console.log("Settings"),
                },
                {
                  label: "Logout",
                  onClick: logout,
                  danger: true,
                },
              ]}
            />
          </>
        }
      />

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}