/**
 * Documents the assumed workspace API surface used by the frontend explorer.
 *
 * The current backend already supports documents, workspaces, and document
 * collaborators, but it does not yet expose persisted folders, folder sharing,
 * or move operations. Keep these assumptions isolated here so the service
 * clients are easy to adapt when backend routes land.
 */
export const workspaceApiContracts = {
  /** REST endpoints assumed by `RestWorkspaceClient`. */
  rest: [
    'GET /api/workspace/items?parentId=:folderId',
    'POST /api/workspace/folders',
    'POST /api/workspace/documents',
    'PATCH /api/workspace/items/:itemId',
    'DELETE /api/workspace/items/:itemId',
    'PATCH /api/workspace/items/:itemId/move',
    'GET /api/workspace/move-targets?excludeItemId=:itemId',
    'POST /api/workspace/items/:itemId/shares',
    'PATCH /api/workspace/items/:itemId/collaborators/:collaboratorId',
    'DELETE /api/workspace/items/:itemId/collaborators/:collaboratorId',
  ],
  /** GraphQL operations assumed by `GraphqlWorkspaceClient`. */
  graphql: [
    'workspaceItems(parentId: ID)',
    'moveTargets(excludeItemId: ID!)',
    'createFolder',
    'createWorkspaceDocument',
    'renameWorkspaceItem',
    'deleteWorkspaceItem',
    'moveWorkspaceItem',
    'shareWorkspaceItem',
    'updateWorkspaceCollaborator',
    'removeWorkspaceCollaborator',
  ],
} as const;
