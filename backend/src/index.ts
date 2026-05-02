import { createApp } from "./app.js";
import { attachGraphqlSubscriptions } from "./apis/graphql/graphql.server.js";
import { env } from "./config/env.js";
import { prisma } from "./lib/prisma.js";
import { attachDocumentSync } from "./sync/documentSync.js";

const app = createApp({ apiMode: env.API_MODE });
const server = app.listen(env.PORT, () => {
  console.log(`Server listening on http://localhost:${env.PORT} (${env.API_MODE} mode)`);
});

if (env.API_MODE === "rest" || env.API_MODE === "all") {
  attachDocumentSync(server);
}

if (env.API_MODE === "graphql" || env.API_MODE === "all") {
  attachGraphqlSubscriptions(server);
}

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
