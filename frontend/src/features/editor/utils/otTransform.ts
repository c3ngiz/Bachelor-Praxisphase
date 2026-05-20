/**
 * Compatibility exports for editor code that previously imported OT utilities
 * from the editor feature. New code should import from `features/collaboration`.
 */

export {
  applyTextOperation,
  codePointLength,
  codePointOffsetToCodeUnitOffset,
  codeUnitOffsetToCodePointOffset,
  transformTextOperation,
  type OperationIdentity,
} from '../../collaboration/utils/operationTransform';
export {
  transformCursor,
  transformCursorPosition,
  transformSelectionRange,
} from '../../collaboration/utils/cursorTransform';
export { stableTextHash as hashText } from '../../collaboration/utils/contentHash';
