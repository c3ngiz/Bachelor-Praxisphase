import { ChevronDown, Users } from "lucide-react";
import Popover from "@/shared/components/ui/Popover";

const WORKSPACES = [
  { id: "w-docflow", name: "DocFlow Team", subtitle: "Design & Product" },
  { id: "w-client", name: "Client Portal", subtitle: "Shared with partners" },
  { id: "w-personal", name: "Personal Notes", subtitle: "Private workspace" },
];

export default function WorkspaceSwitcher() {
  const activeWorkspace = WORKSPACES[0];

  return (
    <Popover
      align="left"
      offset={10}
      className="w-72 overflow-hidden"
      trigger={({ toggle, open }) => (
        <button
          type="button"
          onClick={toggle}
          aria-label="Switch workspace"
          aria-expanded={open}
          className={[
            "inline-flex h-10 items-center gap-3 rounded-xl border border-(--border) px-3",
            "transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-(--focus-ring)",
            open
              ? "bg-(--bg) text-(--fg)"
              : "bg-(--bg-elevated) text-(--fg) hover:bg-(--bg)",
          ].join(" ")}
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
            <Users size={16} />
          </span>

          <span className="flex min-w-0 flex-col items-start">
            <span className="truncate text-sm font-semibold">
              {activeWorkspace.name}
            </span>
            <span className="truncate text-xs text-(--fg-muted)">
              {activeWorkspace.subtitle}
            </span>
          </span>

          <ChevronDown size={16} className="shrink-0 text-(--fg-muted)" />
        </button>
      )}
    >
      {({ close }) => (
        <div>
          <div className="border-b border-(--border) px-4 py-3">
            <h3 className="text-sm font-semibold text-(--fg)">Workspaces</h3>
            <p className="mt-0.5 text-xs text-(--fg-muted)">
              Choose where you want to collaborate
            </p>
          </div>

          <div className="p-2">
            {WORKSPACES.map((workspace, index) => {
              const isActive = index === 0;

              return (
                <button
                  key={workspace.id}
                  type="button"
                  onClick={close}
                  className={[
                    "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition-colors",
                    isActive ? "bg-(--bg)" : "hover:bg-(--bg)",
                  ].join(" ")}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-(--fg)">
                      {workspace.name}
                    </span>
                    <span className="block truncate text-xs text-(--fg-muted)">
                      {workspace.subtitle}
                    </span>
                  </span>

                  {isActive ? (
                    <span className="rounded-md bg-emerald-100 px-2 py-1 text-[11px] font-semibold text-emerald-700">
                      Active
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </Popover>
  );
}