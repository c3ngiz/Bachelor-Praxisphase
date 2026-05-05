import { useCallback, useState } from 'react';

/** Return value for the disclosure state hook. */
export interface UseDisclosureResult {
  /** Whether the disclosure is currently open. */
  isOpen: boolean;
  /** Opens the disclosure. */
  open: () => void;
  /** Closes the disclosure. */
  close: () => void;
  /** Toggles the disclosure state. */
  toggle: () => void;
}

/** Manages open and closed UI state for dialogs, panels, and menus. */
export function useDisclosure(initialState = false): UseDisclosureResult {
  const [isOpen, setIsOpen] = useState(initialState);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((value) => !value), []);

  return { isOpen, open, close, toggle };
}
