import SearchBar from "./toolbar/SearchBar";
import AvatarDropdown from "./AvatarDropdown";
import NotificationsDropdown from "./NotificationsDropdown";

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
          <NotificationsDropdown />
          <AvatarDropdown />
        </div>
      </div>
    </header>
  );
}