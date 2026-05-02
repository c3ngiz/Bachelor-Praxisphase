import { createRestApp } from "./app.js";
import { env } from "../../shared/config/env.js";
import { prisma } from "../../shared/database/prisma.js";

const app = createRestApp();
const server = app.listen(env.PORT, () => {
  console.log(`REST backend listening on http://localhost:${env.PORT}`);
});

async function shutdown(signal: string) {
  console.log(`Received ${signal}. Shutting down REST backend gracefully...`);
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
