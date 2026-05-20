import type {
  CollaborationCursorState,
  CollaborationTextOperation,
} from '../types/collaboration.types';
import { codePointLength } from './operationTransform';

/**
 * Transforms one cursor position after an insert/delete operation.
 *
 * Inserts at or before the cursor shift it right. Deletes before the cursor
 * shift it left, and cursors inside the deleted range collapse to the delete
 * start.
 *
 * @param position - Cursor position in code points.
 * @param op - Applied operation.
 * @param documentLength - Optional post-operation document length for clamping.
 * @returns Transformed cursor position.
 */
export function transformCursorPosition(
  position: number,
  op: CollaborationTextOperation,
  documentLength?: number,
): number {
  let nextPosition = Math.max(0, position);

  if (op.type === 'insert') {
    if (op.pos <= nextPosition) {
      nextPosition += codePointLength(op.text);
    }
  } else if (op.pos < nextPosition) {
    if (nextPosition <= op.pos + op.len) {
      nextPosition = op.pos;
    } else {
      nextPosition = Math.max(op.pos, nextPosition - op.len);
    }
  }

  if (typeof documentLength !== 'number') {
    return nextPosition;
  }

  return clamp(nextPosition, 0, documentLength);
}

/**
 * Transforms and normalizes a selection range after an operation.
 *
 * @param selectionStart - Selection start in code points.
 * @param selectionEnd - Selection end in code points.
 * @param op - Applied operation.
 * @param documentLength - Optional post-operation document length for clamping.
 * @returns Ordered `[start, end]` selection range.
 */
export function transformSelectionRange(
  selectionStart: number,
  selectionEnd: number,
  op: CollaborationTextOperation,
  documentLength?: number,
): readonly [number, number] {
  const start = transformCursorPosition(selectionStart, op, documentLength);
  const end = transformCursorPosition(selectionEnd, op, documentLength);
  return [Math.min(start, end), Math.max(start, end)] as const;
}

/**
 * Transforms a remote cursor state after an applied operation.
 *
 * @param cursor - Remote cursor state.
 * @param op - Applied operation.
 * @param documentLength - Optional post-operation document length for clamping.
 * @returns Cursor state in the post-operation coordinate space.
 */
export function transformCursor(
  cursor: CollaborationCursorState,
  op: CollaborationTextOperation,
  documentLength?: number,
): CollaborationCursorState {
  const [selectionStart, selectionEnd] = transformSelectionRange(
    cursor.selection_start,
    cursor.selection_end,
    op,
    documentLength,
  );

  return {
    ...cursor,
    pos: transformCursorPosition(cursor.pos, op, documentLength),
    selection_end: selectionEnd,
    selection_start: selectionStart,
  };
}

/**
 * Clamps a number to an inclusive range.
 *
 * @param value - Number to clamp.
 * @param min - Inclusive minimum.
 * @param max - Inclusive maximum.
 * @returns Clamped number.
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max));
}
