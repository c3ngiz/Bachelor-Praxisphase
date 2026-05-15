import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Editor } from '@tiptap/core';

import type { EditorPaginationState } from '../types/editor.types';
import {
  calculateA4PageCount,
  calculateA4PageStackHeight,
  measureEditorContentHeight,
} from '../utils/pagination';

/** Options accepted by the editor pagination hook. */
export interface UseEditorPaginationOptions {
  /** TipTap editor instance measured for visual pagination. */
  editor: Editor | null;
  /** Whether pagination observers should be active. */
  enabled: boolean;
}

/** Result returned by the editor pagination hook. */
export interface UseEditorPaginationResult extends EditorPaginationState {
  /** Schedules an immediate page count measurement. */
  measureNow: () => void;
}

/**
 * Calculates visual A4 page count from one mounted TipTap editor.
 *
 * This is intentionally not hard pagination. The document remains one
 * ProseMirror tree so editing, selections, undo/redo, lists, and future Yjs
 * collaboration do not cross editor-instance boundaries. The hook only sizes
 * the visual page backgrounds behind that single editable surface.
 *
 * @param options - Pagination setup options.
 * @returns Visual page count, indexes, stack style, and measurement command.
 */
export function useEditorPagination({
  editor,
  enabled,
}: UseEditorPaginationOptions): UseEditorPaginationResult {
  const [pageCount, setPageCount] = useState(1);

  const measureNow = useCallback(() => {
    if (!enabled) {
      setPageCount(1);
      return;
    }

    const root = getMountedEditorDom(editor);

    if (!root) {
      setPageCount(1);
      return;
    }

    const measuredHeight = measureEditorContentHeight(root);
    setPageCount(calculateA4PageCount(measuredHeight));
  }, [editor, enabled]);

  useEffect(() => {
    if (!enabled) {
      setPageCount(1);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !editor) {
      return undefined;
    }

    const root = getMountedEditorDom(editor);

    if (!root) {
      return undefined;
    }

    let frameId: number | null = null;
    const scheduleMeasurement = (): void => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }

      frameId = window.requestAnimationFrame(() => {
        frameId = null;
        measureNow();
      });
    };
    const resizeObserver =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(scheduleMeasurement);
    const mutationObserver =
      typeof MutationObserver === 'undefined' ? null : new MutationObserver(scheduleMeasurement);

    resizeObserver?.observe(root);
    mutationObserver?.observe(root, {
      attributes: true,
      characterData: true,
      childList: true,
      subtree: true,
    });
    editor.on('update', scheduleMeasurement);
    scheduleMeasurement();

    return () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }

      resizeObserver?.disconnect();
      mutationObserver?.disconnect();
      editor.off('update', scheduleMeasurement);
    };
  }, [editor, enabled, measureNow]);

  const pageIndexes = useMemo(
    () => Array.from({ length: pageCount }, (_, index) => index),
    [pageCount],
  );
  const pageStackStyle = useMemo(
    () => ({ minHeight: `${calculateA4PageStackHeight(pageCount)}px` }),
    [pageCount],
  );

  return {
    measureNow,
    pageCount,
    pageIndexes,
    pageStackStyle,
  };
}

/**
 * Safely returns the mounted ProseMirror DOM root.
 *
 * TipTap exposes a proxy before `EditorContent` creates the real view. Reading
 * `editor.view.dom` during that short window throws, so pagination logic must
 * always go through this guard.
 *
 * @param editor - TipTap editor instance.
 * @returns Mounted editor DOM root, or null while the view is not ready.
 */
function getMountedEditorDom(editor: Editor | null): HTMLElement | null {
  if (!editor || !editor.isInitialized || editor.isDestroyed) {
    return null;
  }

  try {
    return editor.view.dom as HTMLElement;
  } catch {
    return null;
  }
}
