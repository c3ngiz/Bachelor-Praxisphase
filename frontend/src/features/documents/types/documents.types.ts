import type { EntityId, Timestamped } from '../../../shared/types';

/** Document list item used by document screens. */
export interface DocumentItem extends Timestamped {
  /** Unique document identifier. */
  id: EntityId;
  /** Document title. */
  title: string;
}
