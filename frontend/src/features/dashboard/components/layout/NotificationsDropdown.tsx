import {
  Bell,
  CheckCheck,
  MessageSquareText,
  Share2,
  UserPlus,
} from "lucide-react";

import { Popover } from "@/shared/components/ui";
import { useMemo } from "react";
import type { Document } from "@/features/documents";

type NotificationItem = {
  id: string;
  title: string;
  description: string;
  icon: typeof MessageSquareText;
};

type Props = {
  documents: Document[];
  currentUserId: string | null;
};

function toRelativeTime(date?: string): string {
  if (!date) {
    return "Recently";
  }

  const value = new Date(date);
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  const diffMs = value.getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / (1000 * 60));

  if (Math.abs(diffMinutes) < 60) {
    return formatter.format(diffMinutes, "minute");
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return formatter.format(diffHours, "hour");
  }

  const diffDays = Math.round(diffHours / 24);
  return formatter.format(diffDays, "day");
}

/**
 * NotificationsDropdown component.
 */
export default function NotificationsDropdown({ documents, currentUserId }: Props) {
  const notifications = useMemo<NotificationItem[]>(() => {
    return [...documents]
      .sort(
        (a, b) =>
          new Date(b.lastEditedAt ?? b.updatedAt).getTime() -
          new Date(a.lastEditedAt ?? a.updatedAt).getTime(),
      )
      .filter((document) => document.lastEditedById !== currentUserId)
      .slice(0, 5)
      .map((document) => {
        const icon =
          document.visibility === "workspace"
            ? UserPlus
            : document.visibility === "shared"
              ? Share2
              : MessageSquareText;

        return {
          id: document.id,
          title: `${document.lastEditedByName} edited ${document.title}`,
          description: `Updated ${toRelativeTime(document.lastEditedAt)}.`,
          icon,
        };
      });
  }, [currentUserId, documents]);
  return (
    <Popover.Root>
      <Popover.Trigger>
        <button
          type="button"
          aria-label="Notifications"
          className={[
            "inline-flex h-9 w-9 items-center justify-center rounded-lg",
            "transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-(--focus-ring)",
            "text-(--fg-muted) hover:bg-(--bg) hover:text-(--fg)",
          ].join(" ")}
        >
          <Bell size={18} />
        </button>
      </Popover.Trigger>

      <Popover.Content align="right" offset={10} className="w-80 overflow-hidden p-0">
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

            <Popover.Close>
              <button
                type="button"
                className="rounded-lg px-2 py-1 text-xs font-medium text-(--fg-muted) transition-colors hover:bg-(--bg) hover:text-(--fg)"
              >
                Close
              </button>
            </Popover.Close>
          </div>

          {notifications.length > 0 ? (
            <div className="divide-y divide-(--border)">
              {notifications.map((notification) => {
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
            <Popover.Close>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-(--fg-muted) transition-colors hover:bg-(--bg) hover:text-(--fg)"
              >
                <CheckCheck size={16} />
                Mark all as read
              </button>
            </Popover.Close>
          </div>
        </div>
      </Popover.Content>
    </Popover.Root>
  );
}
