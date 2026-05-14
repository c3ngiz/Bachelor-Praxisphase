/** GraphQL query for loading a document into the editor. */
export const editorDocumentQuery = /* GraphQL */ `
  query EditorDocument($documentId: ID!) {
    document(documentId: $documentId) {
      id
      title
      content
      revision
      createdAt
      updatedAt
      ownerId
      ownerName
      collaborators {
        id
        name
        initials
        color
        role
      }
      currentUserRole
      canEdit
      canShare
      canDelete
      lastEditedById
      lastEditedByName
      lastEditedAt
    }
  }
`;

/** GraphQL mutation for fallback document snapshot saves. */
export const updateEditorDocumentMutation = /* GraphQL */ `
  mutation UpdateEditorDocument($documentId: ID!, $input: UpdateDocumentInput!) {
    updateDocument(documentId: $documentId, input: $input) {
      id
      title
      content
      revision
      createdAt
      updatedAt
      ownerId
      ownerName
      collaborators {
        id
        name
        initials
        color
        role
      }
      currentUserRole
      canEdit
      canShare
      canDelete
      lastEditedById
      lastEditedByName
      lastEditedAt
    }
  }
`;
