import { LogOut, Settings, UserRound } from 'lucide-react';
import { useState } from 'react';

import { Avatar, Button, Divider, Dropdown } from '../components';
import type { AuthUser } from '../../features/auth/types/auth.types';

type AuthUserWithImage = AuthUser & {
  avatarUrl?: string;
  imageUrl?: string;
  picture?: string;
};

/** Props for the authenticated app user menu. */
export interface AppUserMenuProps {
  /** Authenticated user displayed in the menu. */
  user: AuthUser;
  /** Clears the current session before redirecting to sign in. */
  onSignOut: () => Promise<void>;
}

const menuLinkClassName =
  'flex w-full items-center gap-2 rounded-md px-3 py-2 text-left outline-none transition-colors hover:bg-slate-100 focus:bg-slate-100';

/**
 * Renders the avatar trigger and user-specific dropdown actions.
 *
 * @param props - Component props.
 * @returns Avatar menu for the authenticated navbar.
 */
export function AppUserMenu({ onSignOut, user }: AppUserMenuProps): JSX.Element {
  const [isSigningOut, setIsSigningOut] = useState(false);
  const avatarFallback = getUserInitials(user);
  const avatarSrc = getAvatarSrc(user);

  async function handleSignOut(): Promise<void> {
    setIsSigningOut(true);

    try {
      await onSignOut();
    } finally {
      window.location.replace('/sign-in');
    }
  }

  return (
    <Dropdown.Root>
      <Dropdown.Trigger>
        <Button
          aria-label="Open user menu"
          className="rounded-full"
          iconOnly
          type="button"
          variant="ghost"
        >
          <Avatar
            alt={user.name}
            fallback={avatarFallback}
            size="md"
            src={avatarSrc}
            className="bg-slate-950 text-white ring-slate-300"
          />
        </Button>
      </Dropdown.Trigger>
      <Dropdown.Content align="end" className="w-64">
        <div className="px-3 py-2">
          <p className="m-0 truncate text-sm font-semibold text-slate-950">{user.name}</p>
          <p className="m-0 truncate text-xs text-slate-500">{user.email}</p>
        </div>
        <Divider className="my-1" />
        <a className={menuLinkClassName} href="/profile" role="menuitem" tabIndex={0}>
          <UserRound className="h-4 w-4" aria-hidden="true" />
          Profile
        </a>
        <a className={menuLinkClassName} href="/settings" role="menuitem" tabIndex={0}>
          <Settings className="h-4 w-4" aria-hidden="true" />
          Settings
        </a>
        <Divider className="my-1" />
        <Dropdown.Item
          className="gap-2 text-red-700 hover:bg-red-50 focus:bg-red-50"
          disabled={isSigningOut}
          onClick={() => void handleSignOut()}
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Logout
        </Dropdown.Item>
      </Dropdown.Content>
    </Dropdown.Root>
  );
}

/**
 * Reads an optional avatar image field from compatible auth user payloads.
 *
 * @param user - Authenticated user.
 * @returns Avatar image URL when present.
 */
function getAvatarSrc(user: AuthUser): string | undefined {
  const userWithImage = user as AuthUserWithImage;

  return userWithImage.avatarUrl ?? userWithImage.imageUrl ?? userWithImage.picture;
}

/**
 * Builds stable avatar initials from backend initials, name, or email.
 *
 * @param user - Authenticated user.
 * @returns Uppercase initials for the avatar fallback.
 */
function getUserInitials(user: AuthUser): string {
  const backendInitials = user.initials?.trim();

  if (backendInitials) {
    return backendInitials.slice(0, 3).toUpperCase();
  }

  const nameInitials = user.name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('');

  if (nameInitials) {
    return nameInitials.toUpperCase();
  }

  return user.email.slice(0, 2).toUpperCase();
}
