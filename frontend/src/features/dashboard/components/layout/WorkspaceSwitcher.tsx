import { useState } from "react";
import { ChevronDown, Plus, Users } from "lucide-react";
import { Button, Input, Modal, Popover } from "@/shared/components/ui";
import { useAuth } from "@/features/auth";
import { useWorkspacesStore } from "@/features/workspaces";

/**
 * WorkspaceSwitcher component.
 */
export default function WorkspaceSwitcher() {
  const { token } = useAuth();
  const {
    activeWorkspace,
    activeWorkspaceId,
    createWorkspace,
    setActiveWorkspaceId,
    workspaces,
  } = useWorkspacesStore();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleCreateWorkspace() {
    if (!token) return;

    if (!name.trim()) {
      setError("Workspace name is required.");
      return;
    }

    try {
      setIsSubmitting(true);
      await createWorkspace(
        {
          name: name.trim(),
          description: description.trim() || undefined,
        },
        token,
      );
      setName("");
      setDescription("");
      setError(null);
      setIsCreateOpen(false);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to create workspace.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const title = activeWorkspace?.name ?? "Workspace";
  const subtitle = activeWorkspace?.isDefault
    ? "Private workspace"
    : activeWorkspace?.description || "Shared workspace";

  return (
    <>
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
              <span className="truncate text-sm font-semibold">{title}</span>
              <span className="truncate text-xs text-white/55">{subtitle}</span>
            </span>

            <ChevronDown size={16} className="shrink-0 text-white/55" />
          </button>
        </Popover.Trigger>

        <Popover.Content align="left" offset={10} className="w-80 overflow-hidden p-0">
          <div>
            <div className="border-b border-(--border) px-4 py-3">
              <h3 className="text-sm font-semibold text-(--fg)">Workspaces</h3>
              <p className="mt-0.5 text-xs text-(--fg-muted)">
                Choose where you want to collaborate
              </p>
            </div>

            <div className="p-2">
              {workspaces.map((workspace) => {
                const isActive = workspace.id === activeWorkspaceId;

                return (
                  <Popover.Close key={workspace.id}>
                    <button
                      type="button"
                      onClick={() => setActiveWorkspaceId(workspace.id)}
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
                          {workspace.isDefault
                            ? "Private workspace"
                            : workspace.description || "Shared workspace"}
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

            <div className="border-t border-(--border) p-2">
              <Popover.Close>
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(true)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-(--fg) transition-colors hover:bg-(--bg)"
                >
                  <Plus size={16} />
                  Create workspace
                </button>
              </Popover.Close>
            </div>
          </div>
        </Popover.Content>
      </Popover.Root>

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)}>
        <Modal.Header>
          <div>
            <Modal.Title>Create workspace</Modal.Title>
            <Modal.Description>
              Create a shared workspace for collaborative documents.
            </Modal.Description>
          </div>
        </Modal.Header>

        <Modal.Body>
          <Input
            label="Workspace name"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              if (error) setError(null);
            }}
            error={error ?? undefined}
            disabled={isSubmitting}
          />
          <Input
            label="Description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            disabled={isSubmitting}
          />
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="ghost"
            onClick={() => setIsCreateOpen(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={() => void handleCreateWorkspace()}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating..." : "Create"}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
