import {
  createContext,
  useContext,
  useEffect,
  useId,
  type HTMLAttributes,
  type ReactNode,
} from "react";

import Button from "../Button";
import { cn } from "@/shared/lib/ui/cn";

type ModalContextValue = {
  descriptionId: string;
  onClose: () => void;
  titleId: string;
};

const ModalContext = createContext<ModalContextValue | null>(null);

function useModalContext(part: string) {
  const context = useContext(ModalContext);

  if (!context) {
    throw new Error(`${part} must be used within Modal.Root`);
  }

  return context;
}

type ModalRootProps = {
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
};

function ModalRoot({ children, isOpen, onClose, title }: ModalRootProps) {
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <ModalContext.Provider value={{ descriptionId, onClose, titleId }}>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        onClick={onClose}
        role="presentation"
      >
        <div
          className="w-full max-w-md rounded-xl border border-(--border) bg-(--bg-elevated) shadow-xl"
          onClick={(event) => event.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
        >
          {title ? (
            <ModalHeader>
              <ModalTitle>{title}</ModalTitle>
            </ModalHeader>
          ) : null}
          {children}
        </div>
      </div>
    </ModalContext.Provider>
  );
}

function ModalHeader({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  const { onClose } = useModalContext("Modal.Header");

  return (
    <div
      className={cn("flex items-start justify-between gap-4 border-b border-(--border) px-5 py-4", className)}
      {...props}
    >
      <div className="min-w-0 flex-1">{children}</div>
      <Button
        variant="ghost"
        size="sm"
        iconOnly
        className="shrink-0"
        onClick={onClose}
        aria-label="Close modal"
      >
        ✕
      </Button>
    </div>
  );
}

function ModalTitle({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  const { titleId } = useModalContext("Modal.Title");

  return (
    <h3 id={titleId} className={cn("text-lg font-semibold text-(--fg)", className)} {...props}>
      {children}
    </h3>
  );
}

function ModalDescription({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  const { descriptionId } = useModalContext("Modal.Description");

  return (
    <p
      id={descriptionId}
      className={cn("mt-1 text-sm leading-6 text-(--fg-muted)", className)}
      {...props}
    >
      {children}
    </p>
  );
}

function ModalBody({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("space-y-4 px-5 py-4", className)} {...props}>
      {children}
    </div>
  );
}

function ModalFooter({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-center justify-end gap-2 border-t border-(--border) px-5 py-4", className)}
      {...props}
    >
      {children}
    </div>
  );
}

const Modal = Object.assign(ModalRoot, {
  Root: ModalRoot,
  Header: ModalHeader,
  Title: ModalTitle,
  Description: ModalDescription,
  Body: ModalBody,
  Footer: ModalFooter,
});

export default Modal;
