import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { StatusCodes } from "http-status-codes";
import { env } from "../../shared/config/env.js";
import { createRestAuthRouter } from "./auth/auth.routes.js";
import { restErrorHandler } from "./common/middleware/errorHandler.js";
import { createRestDocumentRouter } from "./documents/document.routes.js";
import { createRestWorkspaceRouter } from "./workspaces/workspace.routes.js";

/** Creates the standalone REST backend application. */
export function createRestApp() {
  const app = express();

  app.use(
    cors({
      origin: env.CLIENT_ORIGIN,
      credentials: true,
    }),
  );
  app.use(helmet());
  app.use(express.json({ limit: "2mb" }));
  app.use(morgan("dev"));

  app.get("/health", (_request, response) => {
    return response.status(StatusCodes.OK).json({ status: "ok", backend: "rest" });
  });

  app.use("/api/auth", createRestAuthRouter());
  app.use("/api/documents", createRestDocumentRouter());
  app.use("/api/workspaces", createRestWorkspaceRouter());

  app.use((_request, response) => {
    return response.status(StatusCodes.NOT_FOUND).json({
      message: "Route not found.",
    });
  });

  app.use(restErrorHandler);

  return app;
}
