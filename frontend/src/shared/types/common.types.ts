/** Shared entity identifier type. */
export type EntityId = string;

/** Common timestamp metadata for persisted entities. */
export interface Timestamped {
  /** ISO creation timestamp. */
  createdAt: string;
  /** ISO update timestamp. */
  updatedAt: string;
}
