/**
 * Documents the canonical workspace API surface used by the frontend explorer.
 *
 * REST and GraphQL expose the same folder/document hierarchy behavior. Folder
 * permissions are inherited by descendants on the backend while collaborator
 * rows remain direct shares on the item where sharing was configured.
 */
export const workspaceApiContracts = {
  /** REST endpoints assumed by `RestWorkspaceClient`. */
  rest: [
    'GET /api/workspace/items?parentId=:folderId',
    'GET /api/workspace/items/:itemId',
    'POST /api/workspace/folders',
    'POST /api/workspace/documents',
    'PATCH /api/workspace/items/:itemId/rename',
    'DELETE /api/workspace/items/:itemId',
    'PATCH /api/workspace/items/:itemId/move',
    'GET /api/workspace/move-targets?excludeItemId=:itemId',
    'POST /api/workspace/items/:itemId/share',
    'GET /api/workspace/items/:itemId/collaborators',
    'PATCH /api/workspace/items/:itemId/collaborators/:userId',
    'DELETE /api/workspace/items/:itemId/collaborators/:userId',
  ],
  /** GraphQL operations assumed by `GraphqlWorkspaceClient`. */
  graphql: [
    'workspaceItems(parentId: ID)',
    'workspaceItem(id: ID!)',
    'itemCollaborators(itemId: ID!)',
    'moveTargets(excludeItemId: ID!)',
    'createFolder',
    'createDocument',
    'renameWorkspaceItem',
    'deleteWorkspaceItem',
    'moveWorkspaceItem',
    'shareWorkspaceItem',
    'updateWorkspaceCollaborator',
    'removeWorkspaceCollaborator',
  ],
} as const;
