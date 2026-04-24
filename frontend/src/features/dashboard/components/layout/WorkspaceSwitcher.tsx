import { ChevronDown, Users } from "lucide-react";
import { Popover } from "@/shared/components/ui";

const WORKSPACES = [
  { id: "w-docflow", name: "DocFlow Team", subtitle: "Design & Product" },
  { id: "w-client", name: "Client Portal", subtitle: "Shared with partners" },
  { id: "w-personal", name: "Personal Notes", subtitle: "Private workspace" },
];

/**
 * WorkspaceSwitcher component.
 */
export default function WorkspaceSwitcher() {
  const activeWorkspace = WORKSPACES[0];

  return (
    <Popover.Root>
      <Popover.Trigger>
        <button
          type="button"
          aria-label="Switch workspace"
          className={[
            "inline-flex h-10 items-center gap-3 rounded-xl border border-white/10 px-3",
            "transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-(--focus-ring)",
            "bg-white/5 text-white hover:bg-white/10",
          ].join(" ")}
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white">
            <Users size={16} />
          </span>

          <span className="flex min-w-0 flex-col items-start">
            <span className="truncate text-sm font-semibold">
              {activeWorkspace.name}
            </span>
            <span className="truncate text-xs text-white/55">
              {activeWorkspace.subtitle}
            </span>
          </span>

          <ChevronDown size={16} className="shrink-0 text-white/55" />
        </button>
      </Popover.Trigger>

      <Popover.Content align="left" offset={10} className="w-72 overflow-hidden p-0">
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
                <Popover.Close key={workspace.id}>
                  <button
                    type="button"
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
                      <span className="rounded-md bg-violet-100 px-2 py-1 text-[11px] font-semibold text-violet-700">
                        Active
                      </span>
                    ) : null}
                  </button>
                </Popover.Close>
              );
            })}
          </div>
        </div>
      </Popover.Content>
    </Popover.Root>
  );
}
