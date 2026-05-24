import {
  cloneElement,
  createContext,
  forwardRef,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactElement,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

import { cn } from '../../utils';

type ModalContextValue = {
  descriptionId: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  titleId: string;
};

const ModalContext = createContext<ModalContextValue | null>(null);

/**
 * Reads modal context and throws a targeted error when subcomponents are misused.
 *
 * @param component - Name of the modal subcomponent requesting context.
 * @returns Current modal state and accessibility ids.
 */
function useModalContext(component: string): ModalContextValue {
  const context = useContext(ModalContext);

  if (!context) {
    throw new Error(`${component} must be used within Modal.Root`);
  }

  return context;
}

/**
 * Props for the modal root controller.
 *
 * Supports controlled and uncontrolled open state while generating dialog title
 * and description ids for the content subcomponents.
 */
export type ModalRootProps = {
  children: ReactNode;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

/**
 * Provides modal state and generated accessibility ids to subcomponents.
 *
 * @param props - Controlled or uncontrolled modal root props.
 * @returns Modal context provider.
 */
function ModalRoot({ children, defaultOpen = false, open, onOpenChange }: ModalRootProps): JSX.Element {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const descriptionId = useId();
  const titleId = useId();
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

  const value = useMemo(
    () => ({
      descriptionId,
      open: currentOpen,
      setOpen: setCurrentOpen,
      titleId,
    }),
    [currentOpen, descriptionId, setCurrentOpen, titleId],
  );

  return <ModalContext.Provider value={value}>{children}</ModalContext.Provider>;
}

type TriggerChildProps = {
  onClick?: (event: ReactMouseEvent<HTMLElement>) => void;
};

/**
 * Props for the modal trigger slot.
 */
export type ModalTriggerProps = {
  children: ReactElement<TriggerChildProps>;
};

/**
 * Enhances a single child so click events open the modal.
 *
 * @param props - Trigger child element.
 * @returns Trigger element with open behavior.
 */
function ModalTrigger({ children }: ModalTriggerProps): JSX.Element {
  const { setOpen } = useModalContext('Modal.Trigger');

  if (!isValidElement(children)) {
    throw new Error('Modal.Trigger expects a single valid React element child.');
  }

  return cloneElement(children, {
    onClick: (event: ReactMouseEvent<HTMLElement>) => {
      children.props.onClick?.(event);
      if (!event.defaultPrevented) {
        setOpen(true);
      }
    },
  });
}

/**
 * Returns interactive descendants that should participate in the focus trap.
 *
 * @param container - Modal content element.
 * @returns Focusable child elements in DOM order.
 */
function getFocusableElements(container: HTMLElement | null): HTMLElement[] {
  if (!container) {
    return [];
  }

  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((element) => !element.hasAttribute('disabled') && element.getAttribute('aria-hidden') !== 'true');
}

/**
 * Props for the modal dialog content.
 */
export type ModalContentProps = HTMLAttributes<HTMLDivElement> & {
  closeOnOverlayClick?: boolean;
};

const ModalContent = forwardRef<HTMLDivElement, ModalContentProps>(function ModalContent(
  { children, className, closeOnOverlayClick = true, onKeyDown, ...props },
  ref,
) {
  const { descriptionId, open, setOpen, titleId } = useModalContext('Modal.Content');
  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    window.setTimeout(() => {
      const focusable = getFocusableElements(contentRef.current);
      (focusable[0] ?? contentRef.current)?.focus();
    }, 0);

    function handleEscape(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }

    window.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleEscape);
      previouslyFocused?.focus();
    };
  }, [open, setOpen]);

  if (!open || typeof document === 'undefined') {
    return null;
  }

  const setRefs = (node: HTMLDivElement | null): void => {
    contentRef.current = node;

    if (typeof ref === 'function') {
      ref(node);
    } else if (ref) {
      ref.current = node;
    }
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>): void => {
    onKeyDown?.(event);
    if (event.defaultPrevented || event.key !== 'Tab') {
      return;
    }

    const focusable = getFocusableElements(contentRef.current);

    if (focusable.length === 0) {
      event.preventDefault();
      contentRef.current?.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    }

    if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4"
      onMouseDown={(event) => {
        if (closeOnOverlayClick && event.target === event.currentTarget) {
          setOpen(false);
        }
      }}
      role="presentation"
    >
      <div
        ref={setRefs}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        className={cn(
          'max-h-[calc(100vh-2rem)] w-full max-w-lg overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl',
          'focus-visible:outline-none',
          className,
        )}
        onKeyDown={handleKeyDown}
        {...props}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
});

/**
 * Props shared by modal header, body, and footer sections.
 */
export type ModalSectionProps = HTMLAttributes<HTMLDivElement>;

const ModalHeader = forwardRef<HTMLDivElement, ModalSectionProps>(function ModalHeader(
  { className, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn('flex items-start justify-between gap-4 border-b border-slate-200 p-5', className)}
      {...props}
    />
  );
});

const ModalFooter = forwardRef<HTMLDivElement, ModalSectionProps>(function ModalFooter(
  { className, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn('flex items-center justify-end gap-2 border-t border-slate-200 p-5', className)}
      {...props}
    />
  );
});

const ModalBody = forwardRef<HTMLDivElement, ModalSectionProps>(function ModalBody(
  { className, ...props },
  ref,
) {
  return <div ref={ref} className={cn('p-5', className)} {...props} />;
});

/**
 * Props for the modal title heading.
 */
export type ModalTitleProps = HTMLAttributes<HTMLHeadingElement>;

const ModalTitle = forwardRef<HTMLHeadingElement, ModalTitleProps>(function ModalTitle(
  { className, ...props },
  ref,
) {
  const { titleId } = useModalContext('Modal.Title');

  return <h2 ref={ref} id={titleId} className={cn('text-lg font-semibold text-slate-950', className)} {...props} />;
});

/**
 * Props for the modal description text.
 */
export type ModalDescriptionProps = HTMLAttributes<HTMLParagraphElement>;

const ModalDescription = forwardRef<HTMLParagraphElement, ModalDescriptionProps>(function ModalDescription(
  { className, ...props },
  ref,
) {
  const { descriptionId } = useModalContext('Modal.Description');

  return <p ref={ref} id={descriptionId} className={cn('mt-1 text-sm text-slate-500', className)} {...props} />;
});

/**
 * Props for controls that close the active modal.
 */
export type ModalCloseProps = ButtonHTMLAttributes<HTMLButtonElement>;

const ModalClose = forwardRef<HTMLButtonElement, ModalCloseProps>(function ModalClose(
  { className, onClick, type = 'button', ...props },
  ref,
) {
  const { setOpen } = useModalContext('Modal.Close');

  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium text-slate-700 transition-colors',
        'hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2',
        className,
      )}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) {
          setOpen(false);
        }
      }}
      {...props}
    />
  );
});

/**
 * Compound modal component with accessible trigger, content, sections, and close control.
 */
export const Modal = Object.assign(ModalRoot, {
  Root: ModalRoot,
  Trigger: ModalTrigger,
  Content: ModalContent,
  Header: ModalHeader,
  Body: ModalBody,
  Footer: ModalFooter,
  Title: ModalTitle,
  Description: ModalDescription,
  Close: ModalClose,
});

/**
 * Default export for consumers that prefer default compound-component imports.
 */
export default Modal;
