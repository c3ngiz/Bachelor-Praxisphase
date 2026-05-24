/**
 * Compatibility exports for editor code that previously imported OT utilities
 * from the editor feature. New code should import from `features/collaboration`.
 */

/**
 * Re-exports plain-text OT helpers from the collaboration feature for legacy imports.
 */
export {
  applyTextOperation,
  codePointLength,
  codePointOffsetToCodeUnitOffset,
  codeUnitOffsetToCodePointOffset,
  transformTextOperation,
  type OperationIdentity,
} from '../../collaboration/utils/operationTransform';

/**
 * Re-exports cursor transformation helpers from the collaboration feature.
 */
export {
  transformCursor,
  transformCursorPosition,
  transformSelectionRange,
} from '../../collaboration/utils/cursorTransform';

/**
 * Legacy alias for the stable text hash helper used by older editor code.
 */
export { stableTextHash as hashText } from '../../collaboration/utils/contentHash';
