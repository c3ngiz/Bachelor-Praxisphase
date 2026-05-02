# DocFlow Sync Evaluation Plan

DocFlow compares near-real-time document synchronization strategies for a thesis MVP:
REST polling, native WebSocket rooms, and a minimal GraphQL subscription comparison path.

## What To Measure

- Update propagation latency: server update timestamp to client receive timestamp.
- Network overhead: REST polling request count versus push message count.
- Write volume: accepted REST document writes.
- Conflict frequency: revision conflicts caused by stale updates.
- Recovery behavior: whether the editor reaches the current server revision after conflicts or reconnects.

## Manual Test Scenarios

1. REST baseline write
   - Open one document in one browser session.
   - Select REST polling mode.
   - Edit the document and confirm the write succeeds.
   - Export metrics and verify requests and writes increased.

2. REST polling propagation
   - Open the same document in two browser sessions.
   - Set both sessions to REST polling.
   - Repeat with polling intervals of 500ms, 2000ms, and 5000ms.
   - Edit in session A and observe session B.
   - Export metrics from session B and compare latency/request count.

3. WebSocket propagation
   - Open the same document in two browser sessions.
   - Set both sessions to WebSocket mode.
   - Edit in session A and observe session B.
   - Export metrics from session B and compare latency/message count with REST polling.

4. GraphQL subscription propagation
   - Open the same document in two browser sessions.
   - Set both sessions to GraphQL mode.
   - Edit in session A and observe session B.
   - Export metrics from session B and compare with WebSocket.

5. Forced revision conflict
   - Open the same document in two browser sessions.
   - Disconnect or pause one session long enough to make its revision stale.
   - Edit and save in session A.
   - Edit from stale session B.
   - Confirm B records a conflict and accepts the server revision.

## Expected Tradeoffs

- REST polling is simplest and reliable as a fallback, but request overhead grows with shorter intervals.
- WebSocket has lower expected propagation latency and fewer repeated requests, but requires connection state and reconnect handling.
- GraphQL subscriptions provide a structured subscription abstraction, but add protocol complexity for a small document-update stream.
- The current conflict model is optimistic concurrency with full-document replacement; it is intentionally simpler than OT or CRDT and should be discussed as the MVP baseline.

## Export Format

The editor exports JSON with:

- `sessionId`
- `documentId`
- `mode`
- `startedAt`
- `endedAt`
- `samples`
- `summary`

Use the `summary` fields for thesis tables and the `samples` array for detailed timing/conflict traces.
