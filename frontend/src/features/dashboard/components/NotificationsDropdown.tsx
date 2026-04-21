import {
  Bell,
  CheckCheck,
  MessageSquareText,
  Share2,
  UserPlus,
} from "lucide-react";

import Popover from "@/shared/components/ui/Popover";

const NOTIFICATIONS = [
  {
    id: "n1",
    title: "Maya edited Product Brief",
    description: "Updated the launch notes 12 minutes ago.",
    icon: MessageSquareText,
  },
  {
    id: "n2",
    title: "Alex shared Roadmap Q3",
    description: "You now have edit access to this document.",
    icon: Share2,
  },
  {
    id: "n3",
    title: "Liam joined DocFlow Team",
    description: "New viewer added to the workspace today.",
    icon: UserPlus,
  },
];

export default function NotificationsDropdown() {
  return (
    <Popover
      align="right"
      offset={10}
      className="w-80 overflow-hidden"
      trigger={({ toggle, open }) => (
        <button
          type="button"
          onClick={toggle}
          aria-label="Notifications"
          aria-expanded={open}
          className={[
            "inline-flex h-9 w-9 items-center justify-center rounded-lg",
            "transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-(--focus-ring)",
            open
              ? "bg-(--bg) text-(--fg)"
              : "text-(--fg-muted) hover:bg-(--bg) hover:text-(--fg)",
          ].join(" ")}
        >
          <Bell size={18} />
        </button>
      )}
    >
      {({ close }) => (
        <div>
          <div className="flex items-center justify-between border-b border-(--border) px-4 py-3">
            <div>
              <h3 className="text-sm font-semibold text-(--fg)">
                Team activity
              </h3>
              <p className="mt-0.5 text-xs text-(--fg-muted)">
                Recent collaboration across your workspace
              </p>
            </div>

            <button
              type="button"
              onClick={close}
              className="rounded-lg px-2 py-1 text-xs font-medium text-(--fg-muted) transition-colors hover:bg-(--bg) hover:text-(--fg)"
            >
              Close
            </button>
          </div>

          {NOTIFICATIONS.length > 0 ? (
            <div className="divide-y divide-(--border)">
              {NOTIFICATIONS.map((notification) => {
                const Icon = notification.icon;

                return (
                  <div key={notification.id} className="px-4 py-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-(--bg-subtle) text-(--fg-muted)">
                        <Icon size={15} />
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-medium text-(--fg)">
                          {notification.title}
                        </p>
                        <p className="mt-1 text-sm leading-5 text-(--fg-muted)">
                          {notification.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="px-4 py-6 text-sm text-(--fg-muted)">
              You are all caught up.
            </div>
          )}

          <div className="border-t border-(--border) px-4 py-3">
            <button
              type="button"
              onClick={close}
              className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-(--fg-muted) transition-colors hover:bg-(--bg) hover:text-(--fg)"
            >
              <CheckCheck size={16} />
              Mark all as read
            </button>
          </div>
        </div>
      )}
    </Popover>
  );
}