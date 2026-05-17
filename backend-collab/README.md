# CollabDocs OT Sidecar

FastAPI WebSocket service for the thesis plain-text OT prototype.

## Setup

```bash
cd backend-collab
python -m venv .venv
. .venv/bin/activate
pip install -e ".[dev]"
cp .env.example .env
uvicorn app.main:app --host 0.0.0.0 --port 4100 --reload --no-access-log
```

The service expects the same PostgreSQL database and `JWT_SECRET` used by
`backend-rest`.

## WebSocket

```text
ws://localhost:4100/ws/docs/{doc_id}?token=<jwt>
```

The first client message must be:

```json
{ "type": "join", "client_id": "browser-client-id" }
```

## Tests

```bash
pytest
```
