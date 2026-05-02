export const graphqlEntityTypeDefs = /* GraphQL */ `
  scalar JSON

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
    lastEditedById: ID!
    lastEditedByName: String!
    lastEditedAt: String!
  }

  type DocumentUpdateOperation {
    kind: String!
    transport: String
    title: String
    content: JSON
    collaborators: [DocumentCollaborator!]
  }

  type DocumentUpdateEvent {
    type: String!
    documentId: ID!
    version: Int!
    userId: ID!
    timestamp: String!
    operation: DocumentUpdateOperation!
    document: Document!
  }

  type WorkspaceMember {
    id: ID!
    userId: ID!
    email: String!
    name: String!
    initials: String!
    avatarColor: String!
    role: String!
    createdAt: String!
    updatedAt: String!
  }

  type Workspace {
    id: ID!
    name: String!
    description: String
    isDefault: Boolean!
    ownerId: ID!
    currentUserRole: String!
    members: [WorkspaceMember!]!
    createdAt: String!
    updatedAt: String!
  }

  type DeleteDocumentPayload {
    success: Boolean!
  }
`;
