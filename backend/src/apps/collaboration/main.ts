import { Server } from "@hocuspocus/server";
import { env } from "../../shared/config/env.js";
import { prisma } from "../../shared/database/prisma.js";
import {
  authenticateCollaborationConnection,
  loadCollaborationDocument,
  storeCollaborationDocument,
  type CollaborationContext,
} from "./collaboration.service.js";

const server = new Server<CollaborationContext>({
  name: "docflow-collaboration",
  port: env.COLLABORATION_PORT,
  debounce: 2000,
  maxDebounce: 10000,
  quiet: false,
  async onAuthenticate({ token, documentName, connectionConfig }) {
    const context = await authenticateCollaborationConnection({
      token,
      documentName,
    });

    connectionConfig.readOnly = context.readOnly;
    return context;
  },
  async onLoadDocument({ documentName }) {
    return loadCollaborationDocument(documentName);
  },
  async onStoreDocument({ documentName, document, lastContext }) {
    await storeCollaborationDocument({
      documentName,
      document,
      context: lastContext,
    });
  },
});

server.listen();

async function shutdown(signal: string) {
  console.log(`Received ${signal}. Shutting down collaboration backend gracefully...`);
  await server.destroy();
  await prisma.$disconnect();
  process.exit(0);
}

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});
