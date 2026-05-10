/** GraphQL collaborator fields shared by workspace item operations. */
export const workspaceCollaboratorFields = `
  id
  userId
  name
  email
  initials
  avatarColor
  role
  permission
  createdAt
  updatedAt
`;

/** GraphQL owner fields shared by workspace item operations. */
export const workspaceOwnerFields = `
  id
  name
  email
  initials
  avatarColor
`;

/** GraphQL item fields required by the workspace explorer. */
export const workspaceItemFields = `
  id
  kind
  type
  name
  title
  parentId
  owner {
    ${workspaceOwnerFields}
  }
  ownerId
  ownerName
  ownerEmail
  currentUserRole
  permission
  sharingStatus
  visibility
  canEdit
  canWrite
  canShare
  canManage
  canDelete
  collaborators {
    ${workspaceCollaboratorFields}
  }
  createdAt
  updatedAt
  revision
  lastOpenedAt
  childCount
`;

/** GraphQL breadcrumb fields used by folder navigation. */
export const workspaceBreadcrumbFields = `
  id
  name
`;

/** GraphQL move target fields used by the move dialog. */
export const workspaceMoveTargetFields = `
  id
  name
  path
  canMoveHere
`;

/** GraphQL query for listing workspace items in a folder. */
export const workspaceItemsQuery = `
  query WorkspaceItems($parentId: ID) {
    workspaceItems(parentId: $parentId) {
      folderId
      breadcrumbs {
        ${workspaceBreadcrumbFields}
      }
      items {
        ${workspaceItemFields}
      }
    }
  }
`;

/** GraphQL query for listing valid move destinations. */
export const moveTargetsQuery = `
  query MoveTargets($excludeItemId: ID!) {
    moveTargets(excludeItemId: $excludeItemId) {
      ${workspaceMoveTargetFields}
    }
  }
`;

/** GraphQL mutation for creating a folder. */
export const createFolderMutation = `
  mutation CreateFolder($input: CreateFolderInput!) {
    createFolder(input: $input) {
      ${workspaceItemFields}
    }
  }
`;

/** GraphQL mutation for creating a workspace document shell. */
export const createWorkspaceDocumentMutation = `
  mutation CreateWorkspaceDocument($input: CreateWorkspaceDocumentInput!) {
    createWorkspaceDocument(input: $input) {
      ${workspaceItemFields}
    }
  }
`;

/** GraphQL mutation for renaming a workspace item. */
export const renameWorkspaceItemMutation = `
  mutation RenameWorkspaceItem($itemId: ID!, $name: String!) {
    renameWorkspaceItem(itemId: $itemId, name: $name) {
      ${workspaceItemFields}
    }
  }
`;

/** GraphQL mutation for deleting a workspace item. */
export const deleteWorkspaceItemMutation = `
  mutation DeleteWorkspaceItem($itemId: ID!) {
    deleteWorkspaceItem(itemId: $itemId) {
      success
    }
  }
`;

/** GraphQL mutation for moving a workspace item. */
export const moveWorkspaceItemMutation = `
  mutation MoveWorkspaceItem($itemId: ID!, $targetFolderId: ID) {
    moveWorkspaceItem(itemId: $itemId, targetFolderId: $targetFolderId) {
      ${workspaceItemFields}
    }
  }
`;

/** GraphQL mutation for sharing a workspace item. */
export const shareWorkspaceItemMutation = `
  mutation ShareWorkspaceItem($itemId: ID!, $input: ShareWorkspaceItemInput!) {
    shareWorkspaceItem(itemId: $itemId, input: $input) {
      ${workspaceItemFields}
    }
  }
`;

/** GraphQL mutation for changing collaborator access. */
export const updateWorkspaceCollaboratorMutation = `
  mutation UpdateWorkspaceCollaborator(
    $itemId: ID!
    $collaboratorId: ID!
    $permission: String!
  ) {
    updateWorkspaceCollaborator(
      itemId: $itemId
      collaboratorId: $collaboratorId
      permission: $permission
    ) {
      ${workspaceItemFields}
    }
  }
`;

/** GraphQL mutation for removing collaborator access. */
export const removeWorkspaceCollaboratorMutation = `
  mutation RemoveWorkspaceCollaborator($itemId: ID!, $collaboratorId: ID!) {
    removeWorkspaceCollaborator(itemId: $itemId, collaboratorId: $collaboratorId) {
      ${workspaceItemFields}
    }
  }
`;
