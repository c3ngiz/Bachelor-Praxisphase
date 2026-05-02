import { createGraphqlApp } from "./app.js";
import { env } from "../../shared/config/env.js";
import { prisma } from "../../shared/database/prisma.js";

const { app, apolloServer } = await createGraphqlApp();
const server = app.listen(env.PORT, () => {
  console.log(`GraphQL backend listening on http://localhost:${env.PORT}`);
});

async function shutdown(signal: string) {
  console.log(`Received ${signal}. Shutting down GraphQL backend gracefully...`);
  server.close(async () => {
    await apolloServer.stop();
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
