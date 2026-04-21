# DocFlow backend

This is a minimal TypeScript backend for the collaboration app.

## Stack

- Express
- Prisma
- PostgreSQL
- JWT authentication
- Zod request validation

## What is included

- user registration
- user login
- authenticated `me` endpoint
- persistent documents in PostgreSQL
- document CRUD with owner/editor/viewer authorization
- document shape aligned with the current frontend document type

## Setup

1. Copy `.env.example` to `.env`
2. Install dependencies
3. Generate Prisma client
4. Run the first migration
5. Start the dev server

```bash
npm install
cp .env.example .env
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

## API

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Documents

- `GET /api/documents`
- `GET /api/documents/:documentId`
- `POST /api/documents`
- `PATCH /api/documents/:documentId`
- `DELETE /api/documents/:documentId`

## Notes

The frontend currently stores Tiptap content as `unknown` and collaborator data directly on each document object. This backend preserves that shape by storing `content` and `collaborators` as JSON in PostgreSQL via Prisma.

For a later iteration, I would extract collaborators into a dedicated join table once you start implementing sharing workflows in depth. For this first version, JSON keeps the backend simple while matching the existing frontend model.
