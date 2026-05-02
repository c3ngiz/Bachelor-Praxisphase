import { EventEmitter } from "node:events";
import type { DocumentUpdateEvent } from "../../../modules/documents/document.types.js";

const DOCUMENT_UPDATED_EVENT = "document.updated";
const emitter = new EventEmitter();

type DocumentEventListener = (event: DocumentUpdateEvent) => void;

export function publishDocumentUpdate(event: DocumentUpdateEvent): void {
  emitter.emit(DOCUMENT_UPDATED_EVENT, event);
}

export function subscribeToDocumentUpdates(listener: DocumentEventListener): () => void {
  emitter.on(DOCUMENT_UPDATED_EVENT, listener);

  return () => {
    emitter.off(DOCUMENT_UPDATED_EVENT, listener);
  };
}

export function createDocumentUpdateAsyncIterable(
  documentId: string,
): AsyncIterable<{ documentUpdated: DocumentUpdateEvent }> {
  return {
    [Symbol.asyncIterator]() {
      const queue: DocumentUpdateEvent[] = [];
      let pendingResolve:
        | ((value: IteratorResult<{ documentUpdated: DocumentUpdateEvent }>) => void)
        | null = null;

      const unsubscribe = subscribeToDocumentUpdates((event) => {
        if (event.documentId !== documentId) {
          return;
        }

        if (pendingResolve) {
          pendingResolve({ value: { documentUpdated: event }, done: false });
          pendingResolve = null;
          return;
        }

        queue.push(event);
      });

      return {
        async next() {
          const event = queue.shift();

          if (event) {
            return { value: { documentUpdated: event }, done: false };
          }

          return new Promise<IteratorResult<{ documentUpdated: DocumentUpdateEvent }>>(
            (resolve) => {
              pendingResolve = resolve;
            },
          );
        },
        async return() {
          unsubscribe();
          return { value: undefined, done: true };
        },
        async throw(error?: unknown) {
          unsubscribe();
          throw error;
        },
      };
    },
  };
}
