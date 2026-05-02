/** GraphQL schema for the standalone GraphQL backend. */
export const typeDefs = /* GraphQL */ `
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

  input DocumentCollaboratorInput {
    id: ID!
    name: String!
    initials: String!
    color: String!
    role: String!
  }

  input CreateDocumentInput {
    title: String!
    content: JSON
    visibility: String
    workspaceId: ID
    collaborators: [DocumentCollaboratorInput!]
  }

  input UpdateDocumentInput {
    expectedRevision: Int!
    title: String
    content: JSON
    visibility: String
    collaborators: [DocumentCollaboratorInput!]
    lastOpenedAt: String
  }

  input InviteDocumentCollaboratorInput {
    email: String!
    role: String
  }

  input CreateWorkspaceInput {
    name: String!
    description: String
  }

  input InviteWorkspaceMemberInput {
    email: String!
    role: String
  }

  type Query {
    me: AuthUser!
    documents(workspaceId: ID): [Document!]!
    document(documentId: ID!): Document!
    workspaces: [Workspace!]!
  }

  type Mutation {
    register(input: RegisterInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!
    createDocument(input: CreateDocumentInput!): Document!
    updateDocument(documentId: ID!, input: UpdateDocumentInput!): Document!
    inviteDocumentCollaborator(
      documentId: ID!
      input: InviteDocumentCollaboratorInput!
    ): Document!
    deleteDocument(documentId: ID!): DeleteDocumentPayload!
    createWorkspace(input: CreateWorkspaceInput!): Workspace!
    inviteWorkspaceMember(workspaceId: ID!, input: InviteWorkspaceMemberInput!): Workspace!
  }
`;
