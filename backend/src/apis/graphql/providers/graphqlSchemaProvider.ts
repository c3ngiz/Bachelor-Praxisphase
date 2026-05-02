import { buildSchema } from "graphql";
import { graphqlInputTypeDefs } from "../dto/graphqlInputs.js";
import { graphqlEntityTypeDefs } from "../entities/graphqlEntities.js";

export const graphqlSchema = buildSchema(/* GraphQL */ `
  ${graphqlEntityTypeDefs}
  ${graphqlInputTypeDefs}

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

  type Subscription {
    documentUpdated(documentId: ID!): DocumentUpdateEvent!
  }
`);
