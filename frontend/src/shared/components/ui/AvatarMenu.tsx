import type { ReactNode } from "react";
import Popover from "@/shared/components/ui/Popover";

type MenuItem = {
  label: string;
  onClick: () => void;
  danger?: boolean;
  icon?: ReactNode;
};

type Props = {
  avatar?: ReactNode;
  items: MenuItem[];
};

export default function AvatarMenu({ avatar, items }: Props) {
  const normalItems = items.filter((item) => !item.danger);
  const dangerItems = items.filter((item) => item.danger);

  return (
    <Popover
      align="right"
      offset={10}
      className="w-48 overflow-hidden"
      trigger={({ toggle }) => (
        <button
          onClick={toggle}
          className="
            flex h-9 w-9 items-center justify-center
            rounded-full border border-(--border)
            bg-(--bg)
            hover:bg-(--bg-elevated)
          "
        >
          {avatar ?? <span className="text-sm font-medium">U</span>}
        </button>
      )}
    >
      {({ close }) => (
        <div className="py-1">

          {/* Normal items */}
          {normalItems.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                item.onClick();
                close();
              }}
              className="
                flex w-full items-center gap-2 px-4 py-2 text-sm text-left
                text-(--fg) hover:bg-(--bg)
              "
            >
              {item.icon}
              {item.label}
            </button>
          ))}

          {/* Divider before danger */}
          {dangerItems.length > 0 && (
            <div className="my-1 border-t border-(--border)" />
          )}

          {/* Danger items */}
          {dangerItems.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                item.onClick();
                close();
              }}
              className="
                flex w-full items-center gap-2 px-4 py-2 text-sm text-left
                text-red-600 hover:bg-(--bg)
              "
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </Popover>
  );
}