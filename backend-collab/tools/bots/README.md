# Collaboration Bot Harness

Automated two-bot end-to-end harness for the CollabDocs Python backend. It uses
REST for auth/workspace/sharing setup and the real document WebSocket protocol
for plain-text collaboration checks.

## Covered Flow

- Bot accounts sign up, or sign in when they already exist.
- Bot A creates a unique folder and document.
- Bot A shares the document with Bot B using `write` permission.
- Both bots join `/ws/docs/{documentId}?token=<jwt>`.
- The harness verifies snapshot, presence, cursor delivery, simple insert,
  simple delete, concurrent inserts, insert/delete conflict, overlapping
  deletes, monotonic versions, convergence hashes, and metrics.

## Environment

```env
BOT_API_BASE_URL=http://localhost:4000
BOT_WS_BASE_URL=ws://localhost:4000
BOT_OWNER_EMAIL=bot-owner@example.com
BOT_OWNER_PASSWORD=BotPassword123!
BOT_OWNER_NAME=Bot Owner
BOT_COLLAB_EMAIL=bot-collaborator@example.com
BOT_COLLAB_PASSWORD=BotPassword123!
BOT_COLLAB_NAME=Bot Collaborator
BOT_TIMEOUT_SECONDS=20
BOT_VERBOSE=true
```

The URL defaults match this backend's current local port. Override them if your
server is running on another port, for example `http://localhost:8000`.

## Run

From `backend-collab`:

```bash
python -m tools.bots.runner
```

With explicit URLs:

```bash
BOT_API_BASE_URL=http://localhost:8000 \
BOT_WS_BASE_URL=ws://localhost:8000 \
python -m tools.bots.runner
```

JSON-only output:

```bash
python -m tools.bots.runner --json-only
```

The process exits with `0` when every required check passes and non-zero when a
required step fails.

## Expected Output Shape

```text
Collaboration bot harness: PASS
Folder: <uuid> (Bot Test Folder <timestamp>)
Document: <uuid> (Bot Collaboration Test <timestamp>)
Sharing: bot-collaborator@example.com -> write
Checks:
  [PASS] owner auth
  [PASS] collaborator auth
  [PASS] workspace setup
  [PASS] document sharing
  [PASS] presence
  [PASS] cursor/selection
  [PASS] simple insert
  [PASS] simple delete
  [PASS] concurrent inserts
  [PASS] insert/delete conflict
  [PASS] overlapping deletes
  [PASS] version handling
  [PASS] divergence detection
  [PASS] metrics
Final hash: fnv1a32:<bytes>:<hex>
Metrics:
  Server: version=<n>, ops=<n>, acks=<n>, remote=<n>, transformed=<n>, avgAckMs=<ms>, avgServerMs=<ms>
  Transform cases: insert/insert=<n>, insert/delete=<n>, delete/insert=<n>, delete/delete=<n>
  Owner client: sent=<n>, acks=<n>, remote=<n>, avgAckMs=<ms>, avgConvergenceMs=<ms>
  Collaborator client: sent=<n>, acks=<n>, remote=<n>, avgAckMs=<ms>, avgConvergenceMs=<ms>
```

The same run also prints a structured JSON report containing auth identities,
created workspace ids, sharing status, WebSocket client ids, final content,
final hash, server metrics, and client-side latency counters.

## Manual Verification Checklist

- Confirm the backend and database are running and migrations have been applied.
- Run `python -m tools.bots.runner` from `backend-collab`.
- Verify both bot emails appear in the JSON `auth` section.
- Verify `workspace.folderId` and `workspace.documentId` are populated.
- Verify all `checks[].passed` values are `true`.
- Verify `finalHash` matches the backend hash-check response.
- Verify `serverMetrics.totalOperationsSent` and transform counters increased
  after concurrent/conflict scenarios.
