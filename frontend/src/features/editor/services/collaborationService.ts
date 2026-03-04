export class CollaborationService {
  connect(documentId: string) {
    console.log("Connecting to collaboration server for", documentId);
  }

  sendOperation(operation: unknown) {
    console.log("Sending operation", operation);
  }

  onRemoteOperation(callback: (op: unknown) => void) {
    console.log("Register remote op handler");
  }
}