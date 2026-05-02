import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express4";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { StatusCodes } from "http-status-codes";
import { env } from "../../shared/config/env.js";
import { createGraphqlContext, type GraphqlBackendContext } from "./common/context.js";
import { formatGraphqlBackendError } from "./common/errors.js";
import { resolvers } from "./schema/resolvers.js";
import { typeDefs } from "./schema/typeDefs.js";

/** Creates the standalone Apollo GraphQL backend application. */
export async function createGraphqlApp() {
  const app = express();
  const server = new ApolloServer<GraphqlBackendContext>({
    typeDefs,
    resolvers,
    formatError: formatGraphqlBackendError,
  });

  await server.start();

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
    return response.status(StatusCodes.OK).json({ status: "ok", backend: "graphql" });
  });

  app.use("/graphql", expressMiddleware(server, { context: createGraphqlContext }));

  app.use((_request, response) => {
    return response.status(StatusCodes.NOT_FOUND).json({
      message: "Route not found.",
    });
  });

  return { app, apolloServer: server };
}
