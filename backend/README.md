# DocFlow backend

This package contains two standalone backend implementations for the same DocFlow application:

- REST backend: `src/apps/rest`
- GraphQL backend: `src/apps/graphql`

The two backends do not share domain services, repositories, DTOs, controllers, or resolvers. They only share low-level infrastructure from `src/shared`: env loading, Prisma, JWT helpers, and password hashing.

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

## Run

```bash
npm run dev:rest
npm run dev:graphql
```

`npm run dev` defaults to the REST backend.

Production entrypoints:

```bash
npm run build
npm run start:rest
npm run start:graphql
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

- `GET /api/workspaces`
- `POST /api/workspaces`
- `POST /api/workspaces/:workspaceId/members`

## GraphQL Backend

Health:

- `GET /health`

GraphQL:

- `POST /graphql`

Queries:

- `me`
- `documents`
- `document`
- `workspaces`

Mutations:

- `register`
- `login`
- `createDocument`
- `updateDocument`
- `inviteDocumentCollaborator`
- `deleteDocument`
- `createWorkspace`
- `inviteWorkspaceMember`

## Notes

Webhooks, native WebSockets, and GraphQL subscriptions are intentionally not included in this version. They can be reintroduced later as separate backend concerns.
