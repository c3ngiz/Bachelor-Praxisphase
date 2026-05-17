import type { CursorState, TextOp } from '../types/editor.types';

export interface OperationIdentity {
  clientId: string;
  opId: string;
}

export function codeUnitOffsetToCodePointOffset(value: string, offset: number): number {
  return Array.from(value.slice(0, clamp(offset, 0, value.length))).length;
}

export function codePointOffsetToCodeUnitOffset(value: string, offset: number): number {
  return Array.from(value).slice(0, clamp(offset, 0, Array.from(value).length)).join('').length;
}

export function codePointLength(value: string): number {
  return Array.from(value).length;
}

export function applyTextOperation(content: string, op: TextOp): string {
  const pos = clamp(op.pos, 0, codePointLength(content));
  const from = codePointOffsetToCodeUnitOffset(content, pos);

  if (op.type === 'insert') {
    return `${content.slice(0, from)}${op.text}${content.slice(from)}`;
  }

  const to = codePointOffsetToCodeUnitOffset(content, pos + op.len);
  return `${content.slice(0, from)}${content.slice(to)}`;
}

export function transformTextOperation(
  incoming: TextOp,
  incomingIdentity: OperationIdentity,
  accepted: TextOp,
  acceptedIdentity: OperationIdentity,
): TextOp | null {
  const next = { ...incoming };

  if (next.type === 'insert' && accepted.type === 'insert') {
    if (
      accepted.pos < next.pos ||
      (accepted.pos === next.pos &&
        compareIdentity(acceptedIdentity, incomingIdentity) < 0)
    ) {
      return { ...next, pos: next.pos + codePointLength(accepted.text) };
    }

    return next;
  }

  if (next.type === 'insert' && accepted.type === 'delete') {
    if (accepted.pos < next.pos) {
      return { ...next, pos: Math.max(accepted.pos, next.pos - accepted.len) };
    }

    return next;
  }

  if (next.type === 'delete' && accepted.type === 'insert') {
    const insertedLength = codePointLength(accepted.text);

    if (accepted.pos <= next.pos) {
      return { ...next, pos: next.pos + insertedLength };
    }

    if (next.pos < accepted.pos && accepted.pos < next.pos + next.len) {
      return { ...next, len: next.len + insertedLength };
    }

    return next;
  }

  if (next.type === 'delete' && accepted.type === 'delete') {
    const aEnd = next.pos + next.len;
    const bEnd = accepted.pos + accepted.len;

    if (bEnd <= next.pos) {
      return { ...next, pos: Math.max(0, next.pos - accepted.len) };
    }

    if (accepted.pos >= aEnd) {
      return next;
    }

    const overlapStart = Math.max(next.pos, accepted.pos);
    const overlapEnd = Math.min(aEnd, bEnd);
    const overlap = Math.max(0, overlapEnd - overlapStart);
    const length = Math.max(0, next.len - overlap);

    if (length === 0) {
      return null;
    }

    return {
      ...next,
      len: length,
      pos: accepted.pos < next.pos ? accepted.pos : next.pos,
    };
  }

  return next;
}

export function transformCursor(cursor: CursorState, op: TextOp): CursorState {
  return {
    ...cursor,
    pos: transformCursorPosition(cursor.pos, op),
    selection_end: transformCursorPosition(cursor.selection_end, op),
    selection_start: transformCursorPosition(cursor.selection_start, op),
  };
}

export function transformCursorPosition(position: number, op: TextOp): number {
  if (op.type === 'insert') {
    return op.pos <= position ? position + codePointLength(op.text) : position;
  }

  if (op.pos >= position) {
    return position;
  }

  if (position <= op.pos + op.len) {
    return op.pos;
  }

  return Math.max(op.pos, position - op.len);
}

export function hashText(value: string): string {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(16);
}

function compareIdentity(left: OperationIdentity, right: OperationIdentity): number {
  const leftKey = `${left.clientId}:${left.opId}`;
  const rightKey = `${right.clientId}:${right.opId}`;
  return leftKey.localeCompare(rightKey);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max));
}
