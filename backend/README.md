# DocFlow backend

This package contains two API entrypoints for the same DocFlow application:

- REST backend: `src/apps/rest`
- GraphQL backend: `src/apps/graphql`

The workspace/document domain is shared through `src/workspace` so REST and GraphQL enforce the same hierarchy, sharing, and permission rules. The entrypoints still own their transport-specific controllers, resolvers, auth adapters, and error formatting.

## Stack

- Express
- Apollo Server for GraphQL
- Prisma
- PostgreSQL
- JWT authentication
- Zod validation

## Local setup

```bash
cp .env.example .env
npm install
npm run prisma:generate
npm run db:up
npm run prisma:migrate
```

The migration `20260510150000_folder_workspace_reset` is destructive for legacy workspace and document data. It preserves `User` rows, then replaces the old workspace/document tables with `WorkspaceItem`, `Document`, and `WorkspaceItemCollaborator`.

## Run

```bash
npm run dev:rest
npm run dev:graphql
npm run dev:collaboration
```

Start `dev:collaboration` beside REST or GraphQL when using the editor's Live sync mode.

Production entrypoints:

```bash
npm run build
npm run start:rest
npm run start:graphql
npm run start:collaboration
```

## REST Backend

Health:

- `GET /health`

Auth:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

Documents:

- `GET /api/documents`
- `GET /api/documents/:documentId`
- `POST /api/documents`
- `PATCH /api/documents/:documentId`
- `POST /api/documents/:documentId/collaborators`
- `DELETE /api/documents/:documentId`

Workspaces:

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

REST examples:

```bash
curl -H "Authorization: Bearer $TOKEN" http://localhost:4000/api/workspace/items

curl -X POST http://localhost:4000/api/workspace/folders \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"Project notes","parentId":null}'

curl -X POST http://localhost:4000/api/workspace/documents \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"Kickoff","parentId":null,"content":{"type":"doc","content":[]}}'

curl -X PATCH http://localhost:4000/api/workspace/items/$ITEM_ID/move \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"targetFolderId":"'$FOLDER_ID'"}'

curl -X POST http://localhost:4000/api/workspace/items/$ITEM_ID/share \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"email":"teammate@example.com","permission":"write"}'
```

## GraphQL Backend

Health:

- `GET /health`

GraphQL:

- `POST /graphql`

Queries:

- `me`
- `documents`
- `document`
- `workspaceItems(parentId: ID)`
- `workspaceItem(id: ID!)`
- `itemCollaborators(itemId: ID!)`
- `moveTargets(excludeItemId: ID!)`

Mutations:

- `register`
- `login`
- `createDocument`
- `createFolder`
- `renameWorkspaceItem`
- `moveWorkspaceItem`
- `deleteWorkspaceItem`
- `shareWorkspaceItem`
- `updateWorkspaceCollaborator`
- `removeWorkspaceCollaborator`
- `updateDocument`
- `inviteDocumentCollaborator`
- `deleteDocument`

GraphQL examples:

```graphql
query WorkspaceItems($parentId: ID) {
  workspaceItems(parentId: $parentId) {
    breadcrumbs { id name }
    items { id name type permission sharingStatus canWrite canDelete }
  }
}

mutation CreateFolder($input: CreateFolderInput!) {
  createFolder(input: $input) { id name type parentId }
}

mutation ShareWorkspaceItem($input: ShareWorkspaceItemInput!) {
  shareWorkspaceItem(input: $input) {
    id
    collaborators { userId email permission }
  }
}
```

Variables:

```json
{
  "input": {
    "itemId": "workspace_item_id",
    "email": "teammate@example.com",
    "permission": "read"
  }
}
```

## Workspace Rules

- `WorkspaceItem` stores folder/document hierarchy; `Document` stores document content for document items.
- Root items have `parentId = null`; nested items reference a folder item.
- Direct item owners have full access. Direct collaborator permissions are `read` or `write`.
- Folder shares are inherited dynamically by descendants; collaborator rows are not copied to children.
- Owner-only actions are sharing and deletion. Write permission allows create inside folders, rename, move, and document edits.
- Folder moves into itself or descendants are rejected. Active sibling name conflicts return a conflict error.

## Environment

REST and GraphQL run as separate modes. The frontend selects one with its own `VITE_API_MODE`; backend examples:

```bash
PORT=4000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/docflow
JWT_SECRET=replace-me
CLIENT_ORIGIN=http://localhost:5173
```

## Notes

Webhooks, native WebSockets, and GraphQL subscriptions are intentionally not included in this version. They can be reintroduced later as separate backend concerns.
