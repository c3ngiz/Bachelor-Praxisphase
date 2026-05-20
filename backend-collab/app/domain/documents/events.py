"""In-memory document content event broker for GraphQL subscriptions."""

from __future__ import annotations

import asyncio
from collections import defaultdict
from collections.abc import AsyncIterator

from app.domain.documents.schemas import DocumentContentResponse


class DocumentContentEventBroker:
    """Single-process pub/sub broker keyed by document id."""

    def __init__(self) -> None:
        self._subscribers: dict[str, set[asyncio.Queue[DocumentContentResponse]]] = defaultdict(set)

    async def publish(self, document_id: str, event: DocumentContentResponse) -> None:
        """Publish a document content event to current subscribers."""

        subscribers = list(self._subscribers.get(document_id, set()))

        for queue in subscribers:
            self._put_latest(queue, event)

    async def subscribe(self, document_id: str) -> AsyncIterator[DocumentContentResponse]:
        """Yield content events published for one document until the client disconnects."""

        queue: asyncio.Queue[DocumentContentResponse] = asyncio.Queue(maxsize=1)
        self._subscribers[document_id].add(queue)

        try:
            while True:
                yield await queue.get()
        finally:
            self._subscribers[document_id].discard(queue)

            if not self._subscribers[document_id]:
                self._subscribers.pop(document_id, None)

    def _put_latest(
        self,
        queue: asyncio.Queue[DocumentContentResponse],
        event: DocumentContentResponse,
    ) -> None:
        """Put the newest event into a bounded queue, dropping stale queued events."""

        if queue.full():
            try:
                queue.get_nowait()
            except asyncio.QueueEmpty:
                pass

        queue.put_nowait(event)


document_content_events = DocumentContentEventBroker()
