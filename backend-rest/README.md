# CollabDocs REST Backend

NestJS REST backend for the current `frontend/` application. This backend is isolated in `backend-rest/` and does not contain GraphQL concerns.

## Frontend Contract

- REST base URL: `VITE_REST_API_URL`, default `http://localhost:4000`.
- Frontend route prefix expected by axios clients: `/api`.
- Auth token transport: `Authorization: Bearer <token>` from localStorage.
- Auth responses: `{ "token": string, "user": { id, email, name, initials, avatarColor, createdAt, updatedAt } }`.
- Workspace list response: `{ "workspace": { folderId, parentId, breadcrumbs, items } }`.
- Workspace mutation response: `{ "item": WorkspaceItem }`.
- Move target response: `{ "targets": MoveTarget[] }`.
- Collaborator updates use collaborator user ids in the URL.
- Document content is stored as TipTap/ProseMirror-compatible JSON.

## Routes

Auth:

- `POST /api/auth/register`
- `POST /api/auth/sign-up`
- `POST /api/auth/login`
- `POST /api/auth/sign-in`
- `GET /api/auth/me`
- `POST /api/auth/sign-out`
- `POST /api/auth/logout`

Users:

- `GET /api/users/me`
- `GET /api/users/search?email=:query`

Workspace:

- `GET /api/workspace/items?parentId=:folderId`
- `GET /api/workspace/items/:itemId`
- `POST /api/workspace/folders`
- `POST /api/workspace/documents`
- `PATCH /api/workspace/items/:itemId/rename`
- `DELETE /api/workspace/items/:itemId`
- `GET /api/workspace/move-targets?excludeItemId=:itemId`
- `PATCH /api/workspace/items/:itemId/move`
- `POST /api/workspace/items/:itemId/share`
- `GET /api/workspace/items/:itemId/collaborators`
- `PATCH /api/workspace/items/:itemId/collaborators/:collaboratorId`
- `DELETE /api/workspace/items/:itemId/collaborators/:collaboratorId`

Documents:

- `GET /api/workspace/documents/:documentId/content`
- `PATCH /api/workspace/documents/:documentId/content`

## Permission Policy

- Owners can read, write, delete, move, and manage sharing.
- Read collaborators can view metadata and document content.
- Write collaborators can rename, move, and edit document content.
- Only owners can delete or manage sharing.
- Folder permissions are inherited by descendants for access checks. Collaborator rows remain direct shares on the item where sharing was configured.
- Deletion is soft deletion. Deleting a folder marks the folder and all descendants with `deletedAt`.
- Duplicate active names are rejected within the same folder. Root duplicate checks are scoped to the owner.

## Setup

```bash
cd backend-rest
npm install
cp .env.example .env
docker compose up -d
npm run prisma:deploy
npm run prisma:generate
npm run prisma:seed
npm run dev
```

The API runs at `http://localhost:4000`.

Seed users:

- `alex@example.com` / `Password123!`
- `sam@example.com` / `Password123!`

## Development Commands

```bash
npm run dev
npm run build
npm run prisma:migrate
npm run prisma:deploy
npm run prisma:seed
npm run prisma:studio
```

## Request Examples

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"alex@example.com","password":"Password123!"}'

curl http://localhost:4000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"

curl -X POST http://localhost:4000/api/workspace/folders \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"name":"Project Notes","parentId":null}'

curl -X POST http://localhost:4000/api/workspace/documents \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"name":"Draft","parentId":null}'

curl -X PATCH http://localhost:4000/api/workspace/documents/:documentId/content \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"revision":1,"content":{"type":"doc","content":[{"type":"paragraph"}]}}'
```

## Manual Verification Checklist

- Start Postgres with `docker compose up -d`.
- Apply migrations with `npm run prisma:deploy`.
- Generate Prisma Client with `npm run prisma:generate`.
- Start the backend with `npm run dev`.
- Sign up or sign in.
- Load the current user with `/api/auth/me`.
- Create a folder.
- Create a document.
- List workspace items.
- Rename an item.
- Load move targets and move an item.
- Share an item by email.
- Update collaborator permission.
- Remove collaborator access.
- Load document content.
- Save document content.
- Sign out with `/api/auth/sign-out`.

## Notes

- The current frontend has TipTap dependencies and a document route type, but it does not mount a document editor page yet. Document content endpoints are implemented for the expected polling editor transport.
- The frontend's REST auth client does not call a logout endpoint today; `/api/auth/sign-out` is provided as a compatible no-op for future use.
