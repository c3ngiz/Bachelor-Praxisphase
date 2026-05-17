# CollabDocs Python Backend

FastAPI backend for CollabDocs with separated REST and GraphQL transports, a
shared SQLAlchemy domain layer, PostgreSQL persistence, JWT auth, workspace
sharing, document content revisions, and the plain-text OT WebSocket editor.

## Frontend Contract

The current frontend sends bearer tokens from local storage as:

```http
Authorization: Bearer <token>
```

REST defaults to `VITE_REST_API_URL=http://localhost:4000` and uses:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/sign-out`
- `GET /api/users/me`
- `GET /api/users/search?email=:query`
- `GET /api/workspace/items?parentId=:folderId`
- `GET /api/workspace/items/:itemId`
- `POST /api/workspace/folders`
- `POST /api/workspace/documents`
- `PATCH /api/workspace/items/:itemId/rename`
- `PATCH /api/workspace/items/:itemId/move`
- `DELETE /api/workspace/items/:itemId`
- `GET /api/workspace/move-targets?excludeItemId=:itemId`
- `POST /api/workspace/items/:itemId/share`
- `GET /api/workspace/items/:itemId/collaborators`
- `PATCH /api/workspace/items/:itemId/collaborators/:userId`
- `DELETE /api/workspace/items/:itemId/collaborators/:userId`
- `GET /api/workspace/documents/:documentId/content`
- `PATCH /api/workspace/documents/:documentId/content`

GraphQL defaults to `VITE_GRAPHQL_API_URL=http://localhost:4000/graphql` and
exposes frontend-compatible operations including `register`, `login`, `me`,
`workspaceItems`, `workspaceItem`, `itemCollaborators`, `moveTargets`,
`documentContent`, `createFolder`, `createDocument`, `renameWorkspaceItem`,
`moveWorkspaceItem`, `deleteWorkspaceItem`, `shareWorkspaceItem`,
`updateWorkspaceCollaborator`, `removeWorkspaceCollaborator`, and
`updateDocumentContent`.

The editor WebSocket uses:

```text
ws://localhost:4000/ws/docs/{documentId}?token=<jwt>
```

The first message must be:

```json
{ "type": "join", "client_id": "browser-client-id" }
```

If you keep the existing frontend `.env` value `VITE_COLLABORATION_URL=ws://localhost:4100`,
run this same app on port 4100 or change the frontend URL to port 4000.

## Architecture

REST routes live in `app/api/rest`. GraphQL schema and resolvers live in
`app/api/graphql`. Both call shared services in `app/domain`, which use the
SQLAlchemy models in `app/db/models`. The WebSocket collaboration module lives
under `app/domain/collaboration` and uses the same JWT and workspace permission
rules before allowing document access.

```text
backend-collab/
  alembic/
  app/
    api/rest/
    api/graphql/
    common/
    core/
    db/models/
    domain/auth/
    domain/users/
    domain/workspace/
    domain/documents/
    domain/collaboration/
    main.py
  tests/
```

## Permission Model

Deletion is soft delete for workspace items and descendants. Direct shares apply
to the item where they are configured. Folder shares are inherited by descendant
folders and documents for read/write access. Owner-only management actions
remain owner-only: delete, share, update collaborator permissions, and remove
collaborators. Write users can rename, move, and edit content. Read users can
load metadata and content but cannot save.

Move validation rejects non-folder parents, duplicate sibling names, moving into
a folder without write access, moving a folder into itself, and moving a folder
into one of its descendants.

Document JSON saves increment `document_contents.revision`. WebSocket OT
operations update `collab_documents.version` and also refresh document content
revision metadata so polling clients see fresh `updatedAt`/`revision` values.

## Database

The schema is PostgreSQL-first and compatible with the previous Prisma naming:

- `users`
- `workspace_items`
- `workspace_shares`
- `document_contents`
- `collab_documents`
- `collab_operations`
- `collab_snapshots`
- `collab_metric_events`

## Setup

```bash
cd backend-collab
python3 -m venv .venv
. .venv/bin/activate
pip install -e ".[dev]"
cp .env.example .env
docker compose up -d postgres
alembic upgrade head
uvicorn app.main:app --host 0.0.0.0 --port 4000 --reload --no-access-log
```

When reusing a database that was already created by the old Prisma backend,
the tables may already exist but Alembic may not have a revision stamp. In that
case, inspect the schema first, then mark the Python baseline without creating
tables again:

```bash
alembic stamp head
```

If the old backend is already using port 4000, either stop it or run:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 4100 --reload --no-access-log
```

Then set the frontend to:

```env
VITE_REST_API_URL=http://localhost:4100
VITE_GRAPHQL_API_URL=http://localhost:4100/graphql
VITE_COLLABORATION_URL=ws://localhost:4100
```

## Examples

```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H 'content-type: application/json' \
  -d '{"name":"Ada Lovelace","email":"ada@example.com","password":"password123"}'
```

```bash
curl -X POST http://localhost:4000/api/workspace/documents \
  -H 'content-type: application/json' \
  -H "authorization: Bearer $TOKEN" \
  -d '{"name":"Project Notes","parentId":null}'
```

```graphql
mutation Login($input: LoginInput!) {
  login(input: $input) {
    token
    user { id email name initials avatarColor }
  }
}
```

```graphql
query WorkspaceItems($parentId: ID) {
  workspaceItems(parentId: $parentId) {
    folderId
    breadcrumbs { id name }
    items {
      id
      kind
      name
      permission
      sharingStatus
      canWrite
      childCount
      revision
    }
  }
}
```

## Verification Checklist

- Auth: register, login, `GET /api/auth/me`, no-op sign out.
- Workspace: create folder, create document, list root, list folder, rename,
  move, delete, and verify soft-deleted items disappear.
- Sharing: share by email, list collaborators, update permission, remove
  collaborator, verify owner cannot be downgraded, verify read-only cannot save.
- Documents: load content, save content, verify revision increments, verify
  `touch=false` does not change last-opened metadata.
- Collaboration: connect two WebSocket clients, edit from client A, verify client
  B receives `broadcast_op`, and verify document revision metadata updates.
- GraphQL: run equivalent auth, workspace, sharing, and document mutations.

## Quality Commands

```bash
python3 -m compileall app
ruff check app tests
pytest
```
