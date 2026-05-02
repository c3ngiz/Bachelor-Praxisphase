import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { ZodError } from "zod";
import { StatusCodes } from "http-status-codes";
import { env } from "./config/env.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { documentRouter } from "./modules/documents/document.routes.js";
import { workspaceRouter } from "./modules/workspaces/workspace.routes.js";
import { ApiError } from "./utils/apiError.js";

export const app = express();

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
  return response.status(StatusCodes.OK).json({ status: "ok" });
});

app.use("/api/auth", authRouter);
app.use("/api/documents", documentRouter);
app.use("/api/workspaces", workspaceRouter);

app.post("/api/graphql", (_request, response) => {
  return response.status(StatusCodes.OK).json({
    data: {
      schema: {
        subscription:
          "subscription DocumentUpdated($documentId: ID!) { documentUpdated(documentId: $documentId) { documentId version userId timestamp operation document } }",
      },
    },
  });
});

app.use((_request, response) => {
  return response.status(StatusCodes.NOT_FOUND).json({
    message: "Route not found.",
  });
});

app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  if (error instanceof ZodError) {
    return response.status(StatusCodes.BAD_REQUEST).json({
      message: "Validation failed.",
      issues: error.flatten(),
    });
  }

  if (error instanceof ApiError) {
    return response.status(error.statusCode).json({
      message: error.message,
      ...(error.data && typeof error.data === "object" ? error.data : {}),
    });
  }

  console.error(error);

  return response.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
    message: "Internal server error.",
  });
});
