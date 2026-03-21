import { Outlet, Link } from "react-router-dom";
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
            className="flex items-center gap-2 text-(--fg)"
          >
            <div className="h-6 w-6 rounded bg-(--accent)" />
            <span className="font-semibold text-lg hover:text-(--accent-hover)">
              CollabDocs
            </span>
          </Link>
        }
        right={
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
        }
      />

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}