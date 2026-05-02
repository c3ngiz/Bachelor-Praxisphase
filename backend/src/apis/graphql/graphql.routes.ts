import { Router } from "express";
import { StatusCodes } from "http-status-codes";
import { graphql } from "graphql";
import { createGraphqlHttpContext } from "./providers/graphqlContextProvider.js";
import { formatGraphqlError, toGraphqlError } from "./providers/graphqlErrorProvider.js";
import { graphqlSchema } from "./providers/graphqlSchemaProvider.js";
import { graphqlRootValue } from "./resolvers/graphqlResolvers.js";

type GraphqlRequestBody = {
  query?: unknown;
  variables?: unknown;
  operationName?: unknown;
};

export function createGraphqlRouter(): Router {
  const router = Router();

  router.all("/", async (request, response) => {
    const body = (request.body ?? {}) as GraphqlRequestBody;
    const query =
      typeof body.query === "string"
        ? body.query
        : typeof request.query.query === "string"
          ? request.query.query
          : null;

    if (!query) {
      return response.status(StatusCodes.BAD_REQUEST).json({
        errors: [
          {
            message: "GraphQL query is required.",
            extensions: { code: "BAD_REQUEST", statusCode: StatusCodes.BAD_REQUEST },
          },
        ],
      });
    }

    try {
      const result = await graphql({
        schema: graphqlSchema,
        source: query,
        rootValue: graphqlRootValue,
        contextValue: await createGraphqlHttpContext(request),
        variableValues:
          body.variables && typeof body.variables === "object"
            ? (body.variables as Record<string, unknown>)
            : undefined,
        operationName:
          typeof body.operationName === "string" ? body.operationName : undefined,
      });

      return response.status(StatusCodes.OK).json({
        ...result,
        errors: result.errors?.map(formatGraphqlError),
      });
    } catch (error) {
      const graphqlError = toGraphqlError(error);
      return response.status(StatusCodes.OK).json({
        errors: [formatGraphqlError(graphqlError)],
      });
    }
  });

  return router;
}
