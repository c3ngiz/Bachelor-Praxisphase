# DocFlow backend

This is a minimal TypeScript backend for the collaboration app.

## Stack

- Express
- Prisma
- PostgreSQL
- Docker Compose for the local database
- JWT authentication
- Zod request validation

## What is included

- user registration
- user login
- authenticated `me` endpoint
- persistent documents in PostgreSQL
- document CRUD with owner/editor/viewer authorization
- document shape aligned with the current frontend document type

## Local development setup

This setup runs **PostgreSQL in Docker** and the **backend locally**.

### 1. Copy the environment file

```bash
cp .env.example .env
```

### 2. Start PostgreSQL in Docker

```bash
npm run db:up
```

The database will be available at `localhost:5432` and Prisma will connect through the `DATABASE_URL` in `.env`.

### 3. Install dependencies

```bash
npm install
```

### 4. Generate the Prisma client

```bash
npm run prisma:generate
```

### 5. Run the initial migration

```bash
npm run prisma:migrate -- --name init
```

### 6. Start the backend

```bash
npm run dev
```

## Useful database commands

```bash
npm run db:up
npm run db:logs
npm run db:down
npm run db:reset
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
