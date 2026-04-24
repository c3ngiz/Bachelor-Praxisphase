import SearchBar from "../toolbar/SearchBar";
import AvatarDropdown from "./AvatarDropdown";
import NotificationsDropdown from "./NotificationsDropdown";
import AppLogo from "./AppLogo";
import InviteMembersButton from "./InviteMembersButton";
import WorkspaceSwitcher from "./WorkspaceSwitcher";
import type { Document } from "@/features/documents";
import { useAuth } from "@/features/auth";

type Props = {
  documents: Document[];
};

/**
 * DashboardNavbar component.
 */
export default function DashboardNavbar({ documents }: Props) {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-[#030618] text-white shadow-[0_12px_34px_rgba(3,6,24,0.24)]">
      <div className="flex h-16 w-full items-center gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <AppLogo
            labelClassName="hidden text-[17px] font-semibold text-white sm:block"
            className="text-white"
          />
          <div className="hidden lg:block">
            <WorkspaceSwitcher />
          </div>
        </div>

        <div className="flex flex-1 justify-start px-0 sm:justify-center sm:px-2">
          <div className="w-full max-w-[34rem]">
            <SearchBar />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <InviteMembersButton />
          </div>
          <NotificationsDropdown
            documents={documents}
            currentUserId={user?.id ?? null}
          />
          <AvatarDropdown />
        </div>
      </div>
    </header>
  );
}
