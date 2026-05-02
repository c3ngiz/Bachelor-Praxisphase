import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { ZodError } from "zod";
import { StatusCodes } from "http-status-codes";
import { env } from "./config/env.js";
import { createGraphqlRouter } from "./apis/graphql/graphql.routes.js";
import { createRestRouter } from "./apis/rest/rest.routes.js";
import { createWebhooksRouter } from "./apis/webhooks/webhooks.routes.js";
import { ApiError } from "./utils/apiError.js";

export type ApiMode = "rest" | "graphql" | "all";

type CreateAppOptions = {
  apiMode: ApiMode;
};

function shouldMountRest(apiMode: ApiMode): boolean {
  return apiMode === "rest" || apiMode === "all";
}

function shouldMountGraphql(apiMode: ApiMode): boolean {
  return apiMode === "graphql" || apiMode === "all";
}

export function createApp({ apiMode }: CreateAppOptions) {
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
    return response.status(StatusCodes.OK).json({ status: "ok", apiMode });
  });

  app.use("/api/webhooks", createWebhooksRouter());

  if (shouldMountRest(apiMode)) {
    app.use("/api", createRestRouter());
  }

  if (shouldMountGraphql(apiMode)) {
    app.use("/graphql", createGraphqlRouter());
  }

  app.use((_request, response) => {
    return response.status(StatusCodes.NOT_FOUND).json({
      message: "Route not found.",
    });
  });

  app.use(
    (
      error: unknown,
      _request: express.Request,
      response: express.Response,
      _next: express.NextFunction,
    ) => {
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
    },
  );

  return app;
}
