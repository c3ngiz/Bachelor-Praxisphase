import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

import { Button } from '../../../shared/components';
import { cn } from '../../../shared/utils';

/** Props for an editor toolbar button. */
export interface ToolbarButtonProps {
  /** Whether the represented command is active at the current selection. */
  active?: boolean;
  /** Visible button content when the button is not icon-only. */
  children?: ReactNode;
  /** Whether the command is unavailable. */
  disabled?: boolean;
  /** Icon rendered before text or as the only visual content. */
  icon: LucideIcon;
  /** Accessible command label. */
  label: string;
  /** Executes the editor command. */
  onClick: () => void;
}

/**
 * Renders a compact, accessible editor command button.
 *
 * Active buttons use an explicit foreground color so icons remain visible when
 * formatting is selected.
 *
 * @param props - Toolbar button props.
 * @returns Editor command button.
 */
export function ToolbarButton({
  active = false,
  children,
  disabled = false,
  icon: Icon,
  label,
  onClick,
}: ToolbarButtonProps): JSX.Element {
  const iconOnly = !children;

  return (
    <Button
      aria-label={label}
      aria-pressed={active}
      className={cn(
        'editor-toolbar-command',
        active && 'editor-toolbar-command--active',
        !iconOnly && 'w-full justify-start',
      )}
      disabled={disabled}
      iconOnly={iconOnly}
      onClick={onClick}
      size="sm"
      title={label}
      variant="secondary"
    >
      <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
      {children ? <span className="truncate">{children}</span> : null}
    </Button>
  );
}
