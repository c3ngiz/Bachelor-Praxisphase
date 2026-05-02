import { app } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";
import { attachDocumentSync } from "./sync/documentSync.js";

const server = app.listen(env.PORT, () => {
  console.log(`Server listening on http://localhost:${env.PORT}`);
});

attachDocumentSync(server);

async function shutdown(signal: string) {
  console.log(`Received ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});
