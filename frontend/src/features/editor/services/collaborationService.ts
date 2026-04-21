export class CollaborationService {
  private remoteOperationHandler: ((op: unknown) => void) | null = null;

  connect(documentId: string) {
    console.log("Connecting to collaboration server for", documentId);
  }

  sendOperation(operation: unknown) {
    this.remoteOperationHandler?.(operation);
    console.log("Sending operation", operation);
  }

  onRemoteOperation(callback: (op: unknown) => void) {
    this.remoteOperationHandler = callback;
    console.log("Register remote op handler");
  }
}
