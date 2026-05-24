import {
  cloneElement,
  createContext,
  forwardRef,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type HTMLAttributes,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactElement,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

import { cn } from '../../utils';

type DropdownAlign = 'start' | 'center' | 'end';

type DropdownContextValue = {
  contentId: string;
  contentRef: React.MutableRefObject<HTMLDivElement | null>;
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.MutableRefObject<HTMLSpanElement | null>;
};

const DropdownContext = createContext<DropdownContextValue | null>(null);

/**
 * Reads the dropdown context and reports component misuse with a targeted error.
 *
 * @param component - Name of the dropdown subcomponent requesting context.
 * @returns Current dropdown state and refs.
 */
function useDropdownContext(component: string): DropdownContextValue {
  const context = useContext(DropdownContext);

  if (!context) {
    throw new Error(`${component} must be used within Dropdown.Root`);
  }

  return context;
}

/**
 * Props for the dropdown root controller.
 *
 * Supports controlled and uncontrolled open state. The root also owns trigger
 * and content refs used for outside-click dismissal and positioning.
 */
export type DropdownRootProps = {
  children: ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

/**
 * Provides dropdown state and dismissal behavior to trigger/content/items.
 *
 * @param props - Controlled or uncontrolled dropdown root props.
 * @returns Dropdown context provider.
 */
function DropdownRoot({ children, defaultOpen = false, open, onOpenChange }: DropdownRootProps): JSX.Element {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const contentId = useId();
  const contentRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLSpanElement | null>(null);
  const isControlled = open !== undefined;
  const currentOpen = isControlled ? open : uncontrolledOpen;

  const setCurrentOpen = useCallback(
    (nextOpen: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(nextOpen);
      }

      onOpenChange?.(nextOpen);
    },
    [isControlled, onOpenChange],
  );

  useEffect(() => {
    if (!currentOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent): void {
      const target = event.target as Node;

      if (triggerRef.current?.contains(target) || contentRef.current?.contains(target)) {
        return;
      }

      setCurrentOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        setCurrentOpen(false);
        triggerRef.current?.querySelector<HTMLElement>('button, [href], [tabindex]:not([tabindex="-1"])')?.focus();
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentOpen, setCurrentOpen]);

  const value = useMemo(
    () => ({
      contentId,
      contentRef,
      open: currentOpen,
      setOpen: setCurrentOpen,
      triggerRef,
    }),
    [contentId, currentOpen, setCurrentOpen],
  );

  return <DropdownContext.Provider value={value}>{children}</DropdownContext.Provider>;
}

type TriggerChildProps = {
  onClick?: (event: ReactMouseEvent<HTMLElement>) => void;
  onKeyDown?: (event: ReactKeyboardEvent<HTMLElement>) => void;
  'aria-controls'?: string;
  'aria-expanded'?: boolean;
  'aria-haspopup'?: 'menu';
};

/**
 * Props for the dropdown trigger slot.
 *
 * The single child receives menu ARIA attributes and keyboard/click handlers.
 */
export type DropdownTriggerProps = {
  children: ReactElement<TriggerChildProps>;
};

/**
 * Enhances a trigger element so it opens and describes the dropdown menu.
 *
 * @param props - Trigger child element.
 * @returns Wrapped trigger element.
 */
function DropdownTrigger({ children }: DropdownTriggerProps): JSX.Element {
  const { contentId, open, setOpen, triggerRef } = useDropdownContext('Dropdown.Trigger');

  if (!isValidElement(children)) {
    throw new Error('Dropdown.Trigger expects a single valid React element child.');
  }

  return (
    <span ref={triggerRef} className="inline-flex">
      {cloneElement(children, {
        'aria-controls': contentId,
        'aria-expanded': open,
        'aria-haspopup': 'menu',
        onClick: (event: ReactMouseEvent<HTMLElement>) => {
          children.props.onClick?.(event);
          if (!event.defaultPrevented) {
            setOpen(!open);
          }
        },
        onKeyDown: (event: ReactKeyboardEvent<HTMLElement>) => {
          children.props.onKeyDown?.(event);
          if (event.defaultPrevented) {
            return;
          }

          if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setOpen(true);
          }
        },
      })}
    </span>
  );
}

/**
 * Props for the dropdown content popover.
 */
export type DropdownContentProps = HTMLAttributes<HTMLDivElement> & {
  align?: DropdownAlign;
  offset?: number;
};

/**
 * Returns focusable menu items in DOM order for roving keyboard navigation.
 *
 * @param container - Dropdown content element.
 * @returns Enabled menu item elements.
 */
function getMenuItems(container: HTMLDivElement | null): HTMLElement[] {
  if (!container) {
    return [];
  }

  return Array.from(container.querySelectorAll<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])'));
}

/**
 * Computes fixed-position menu coordinates from the trigger rectangle.
 *
 * @param trigger - Trigger wrapper element.
 * @param align - Desired horizontal alignment.
 * @param offset - Vertical spacing from trigger to menu.
 * @returns Inline style used by the portal-rendered menu.
 */
function getContentStyle(trigger: HTMLSpanElement, align: DropdownAlign, offset: number): CSSProperties {
  const rect = trigger.getBoundingClientRect();
  const style: CSSProperties = {
    left: rect.left,
    minWidth: rect.width,
    position: 'fixed',
    top: rect.bottom + offset,
  };

  if (align === 'center') {
    style.left = rect.left + rect.width / 2;
    style.transform = 'translateX(-50%)';
  }

  if (align === 'end') {
    style.left = rect.right;
    style.transform = 'translateX(-100%)';
  }

  return style;
}

const DropdownContent = forwardRef<HTMLDivElement, DropdownContentProps>(function DropdownContent(
  { align = 'end', children, className, offset = 8, onKeyDown, style, ...props },
  ref,
) {
  const { contentId, contentRef, open, setOpen, triggerRef } = useDropdownContext('Dropdown.Content');
  const [position, setPosition] = useState<CSSProperties | null>(null);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) {
      return;
    }

    const updatePosition = (): void => {
      if (triggerRef.current) {
        setPosition(getContentStyle(triggerRef.current, align, offset));
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [align, offset, open, triggerRef]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const firstItem = getMenuItems(contentRef.current)[0];
    firstItem?.focus();
  }, [contentRef, open]);

  if (!open || typeof document === 'undefined') {
    return null;
  }

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>): void => {
    onKeyDown?.(event);
    if (event.defaultPrevented) {
      return;
    }

    const items = getMenuItems(contentRef.current);
    const currentIndex = items.indexOf(document.activeElement as HTMLElement);

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      items[(currentIndex + 1 + items.length) % items.length]?.focus();
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      items[(currentIndex - 1 + items.length) % items.length]?.focus();
    }

    if (event.key === 'Home') {
      event.preventDefault();
      items[0]?.focus();
    }

    if (event.key === 'End') {
      event.preventDefault();
      items[items.length - 1]?.focus();
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.querySelector<HTMLElement>('button, [href], [tabindex]:not([tabindex="-1"])')?.focus();
    }
  };

  const setRefs = (node: HTMLDivElement | null): void => {
    contentRef.current = node;

    if (typeof ref === 'function') {
      ref(node);
    } else if (ref) {
      ref.current = node;
    }
  };

  return createPortal(
    <div
      ref={setRefs}
      id={contentId}
      role="menu"
      tabIndex={-1}
      className={cn(
        'z-50 rounded-lg border border-slate-200 bg-white p-1 text-sm text-slate-700 shadow-lg',
        'focus-visible:outline-none',
        className,
      )}
      style={{ ...position, ...style }}
      onKeyDown={handleKeyDown}
      {...props}
    >
      {children}
    </div>,
    document.body,
  );
});

/**
 * Props for a dropdown menu item.
 */
export type DropdownItemProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  closeOnSelect?: boolean;
};

const DropdownItem = forwardRef<HTMLButtonElement, DropdownItemProps>(function DropdownItem(
  { className, closeOnSelect = true, disabled, onClick, type = 'button', ...props },
  ref,
) {
  const { setOpen } = useDropdownContext('Dropdown.Item');

  return (
    <button
      ref={ref}
      type={type}
      role="menuitem"
      disabled={disabled}
      aria-disabled={disabled || undefined}
      className={cn(
        'flex w-full items-center rounded-md px-3 py-2 text-left outline-none transition-colors',
        'hover:bg-slate-100 focus:bg-slate-100 disabled:pointer-events-none disabled:opacity-50',
        className,
      )}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented && closeOnSelect) {
          setOpen(false);
        }
      }}
      {...props}
    />
  );
});

/**
 * Compound dropdown component for accessible command menus.
 */
export const Dropdown = Object.assign(DropdownRoot, {
  Root: DropdownRoot,
  Trigger: DropdownTrigger,
  Content: DropdownContent,
  Item: DropdownItem,
});

/**
 * Default export for consumers that prefer default compound-component imports.
 */
export default Dropdown;
