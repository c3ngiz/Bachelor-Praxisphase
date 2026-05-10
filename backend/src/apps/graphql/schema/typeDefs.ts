/** GraphQL schema for the standalone GraphQL backend. */
export const typeDefs = /* GraphQL */ `
  scalar JSON

  enum PermissionLevel {
    owner
    read
    write
  }

  enum WorkspaceItemType {
    folder
    document
  }

  type AuthUser {
    id: ID!
    email: String!
    name: String!
    initials: String!
    avatarColor: String!
    createdAt: String!
    updatedAt: String!
  }

  type AuthPayload {
    token: String!
    user: AuthUser!
  }

  type WorkspaceUser {
    id: ID!
    email: String!
    name: String!
    initials: String!
    avatarColor: String!
  }

  type Collaborator {
    id: ID!
    userId: ID!
    email: String!
    name: String!
    initials: String!
    avatarColor: String!
    permission: PermissionLevel!
    role: PermissionLevel!
    createdAt: String!
    updatedAt: String!
  }

  type WorkspaceItem {
    id: ID!
    kind: WorkspaceItemType!
    type: WorkspaceItemType!
    name: String!
    title: String!
    parentId: ID
    owner: WorkspaceUser!
    ownerId: ID!
    ownerName: String!
    ownerEmail: String!
    currentUserRole: PermissionLevel!
    permission: PermissionLevel!
    sharingStatus: String!
    visibility: String!
    canEdit: Boolean!
    canWrite: Boolean!
    canShare: Boolean!
    canManage: Boolean!
    canDelete: Boolean!
    collaborators: [Collaborator!]!
    createdAt: String!
    updatedAt: String!
    revision: Int
    lastOpenedAt: String
    childCount: Int
  }

  type FolderItem {
    id: ID!
    kind: WorkspaceItemType!
    type: WorkspaceItemType!
    name: String!
    parentId: ID
    childCount: Int
  }

  type DocumentItem {
    id: ID!
    kind: WorkspaceItemType!
    type: WorkspaceItemType!
    name: String!
    title: String!
    parentId: ID
    revision: Int
    lastOpenedAt: String
  }

  type WorkspaceBreadcrumb {
    id: ID
    name: String!
  }

  type WorkspaceItemsResult {
    folderId: ID
    breadcrumbs: [WorkspaceBreadcrumb!]!
    items: [WorkspaceItem!]!
  }

  type MoveTarget {
    id: ID
    name: String!
    path: String!
    canMoveHere: Boolean!
  }

  type DeleteWorkspaceItemPayload {
    success: Boolean!
  }

  type DocumentCollaborator {
    id: ID!
    name: String!
    initials: String!
    color: String!
    role: String!
  }

  type Document {
    id: ID!
    title: String!
    content: JSON!
    revision: Int!
    author: String!
    createdAt: String!
    updatedAt: String!
    lastOpenedAt: String
    visibility: String!
    workspaceId: ID!
    ownerId: ID!
    ownerName: String!
    collaborators: [DocumentCollaborator!]!
    currentUserRole: String
    canEdit: Boolean!
    canShare: Boolean!
    canDelete: Boolean!
    lastEditedById: ID!
    lastEditedByName: String!
    lastEditedAt: String!
  }

  type DeleteDocumentPayload {
    success: Boolean!
  }

  input RegisterInput {
    email: String!
    password: String!
    name: String!
    avatarColor: String
  }

  input LoginInput {
    email: String!
    password: String!
  }

  input CreateFolderInput {
    name: String!
    parentId: ID
  }

  input CreateDocumentInput {
    name: String
    title: String
    parentId: ID
    content: JSON
  }

  input CreateWorkspaceDocumentInput {
    name: String
    title: String
    parentId: ID
    content: JSON
  }

  input RenameWorkspaceItemInput {
    itemId: ID!
    name: String!
  }

  input MoveWorkspaceItemInput {
    itemId: ID!
    targetFolderId: ID
  }

  input ShareWorkspaceItemInput {
    itemId: ID
    email: String!
    permission: PermissionLevel
    role: String
  }

  input UpdateWorkspaceCollaboratorInput {
    itemId: ID!
    userId: ID
    collaboratorId: ID
    permission: PermissionLevel
    role: String
  }

  input RemoveWorkspaceCollaboratorInput {
    itemId: ID!
    userId: ID
    collaboratorId: ID
  }

  input UpdateDocumentInput {
    expectedRevision: Int!
    title: String
    content: JSON
    lastOpenedAt: String
  }

  input InviteDocumentCollaboratorInput {
    email: String!
    role: String
  }

  type Query {
    me: AuthUser!
    workspaceItems(parentId: ID): WorkspaceItemsResult!
    workspaceItem(id: ID!): WorkspaceItem!
    itemCollaborators(itemId: ID!): [Collaborator!]!
    moveTargets(excludeItemId: ID!): [MoveTarget!]!
    documents(workspaceId: ID): [Document!]!
    document(documentId: ID!): Document!
  }

  type Mutation {
    register(input: RegisterInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!
    createFolder(input: CreateFolderInput!): WorkspaceItem!
    createDocument(input: CreateDocumentInput!): WorkspaceItem!
    createWorkspaceDocument(input: CreateWorkspaceDocumentInput!): WorkspaceItem!
    renameWorkspaceItem(input: RenameWorkspaceItemInput, itemId: ID, name: String): WorkspaceItem!
    moveWorkspaceItem(input: MoveWorkspaceItemInput, itemId: ID, targetFolderId: ID): WorkspaceItem!
    deleteWorkspaceItem(id: ID, itemId: ID): DeleteWorkspaceItemPayload!
    shareWorkspaceItem(input: ShareWorkspaceItemInput!, itemId: ID): WorkspaceItem!
    updateWorkspaceCollaborator(
      input: UpdateWorkspaceCollaboratorInput
      itemId: ID
      collaboratorId: ID
      permission: PermissionLevel
    ): WorkspaceItem!
    removeWorkspaceCollaborator(
      input: RemoveWorkspaceCollaboratorInput
      itemId: ID
      collaboratorId: ID
    ): WorkspaceItem!
    updateDocument(documentId: ID!, input: UpdateDocumentInput!): Document!
    inviteDocumentCollaborator(
      documentId: ID!
      input: InviteDocumentCollaboratorInput!
    ): Document!
    deleteDocument(documentId: ID!): DeleteDocumentPayload!
  }
`;
