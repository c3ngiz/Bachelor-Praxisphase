# Frontend backend integration

This package contains the frontend files needed to connect the existing React app to the REST backend.

## What changed

- Auth is now backed by the backend JWT endpoints.
- The frontend no longer uses localStorage for auth or documents.
- Documents are loaded and persisted through the backend API.
- Document and user data are sourced from backend API responses.

## Environment

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

## Expected backend URLs

```env
VITE_BACKEND_KIND=rest
VITE_API_URL=http://localhost:4000/api
VITE_REST_API_URL=http://localhost:4000/api
VITE_GRAPHQL_API_URL=http://localhost:4000/graphql
VITE_COLLABORATION_WS_URL=ws://localhost:4100
```

Use `VITE_BACKEND_KIND=graphql` to run CRUD flows against the GraphQL backend.
The editor's Live mode always connects to the collaboration WebSocket URL.

## Required app wiring

Wrap your app with `AuthProvider` and load documents after sign-in.

Typical pattern:

```tsx
<AuthProvider>
  <App />
</AuthProvider>
```

Inside your authenticated app shell:

```tsx
const { token, isAuthenticated } = useAuth();
const loadDocuments = useDocumentsStore((state) => state.loadDocuments);

useEffect(() => {
  if (!token || !isAuthenticated) return;
  void loadDocuments(token);
}, [token, isAuthenticated, loadDocuments]);
```

## Important migration note

`createDocument`, `updateDocument`, `deleteDocument`, and `deleteDocuments` are asynchronous now because they call the backend.
You should `await` them in UI handlers.
