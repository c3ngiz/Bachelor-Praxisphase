export const graphqlInputTypeDefs = /* GraphQL */ `
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
`;
