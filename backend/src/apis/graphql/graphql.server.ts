import type { Server } from "node:http";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/use/ws";
import {
  createGraphqlWebSocketContext,
  type GraphqlContext,
} from "./providers/graphqlContextProvider.js";
import { formatGraphqlError } from "./providers/graphqlErrorProvider.js";
import { graphqlSchema } from "./providers/graphqlSchemaProvider.js";
import { graphqlRootValue } from "./resolvers/graphqlResolvers.js";

export function attachGraphqlSubscriptions(server: Server): void {
  const websocketServer = new WebSocketServer({ noServer: true });
  const subscriptionServer = useServer<Record<string, unknown>>(
    {
      schema: graphqlSchema,
      roots: {
        query: graphqlRootValue,
        mutation: graphqlRootValue,
        subscription: graphqlRootValue,
      },
      context: async (context): Promise<GraphqlContext> => {
        return createGraphqlWebSocketContext({
          request: context.extra.request,
          connectionParams: context.connectionParams,
        });
      },
      onError: (_context, _id, _payload, errors) => errors.map(formatGraphqlError),
    },
    websocketServer,
  );

  server.on("upgrade", (request, socket, head) => {
    const url = new URL(request.url ?? "/", "http://localhost");

    if (url.pathname !== "/graphql") {
      return;
    }

    websocketServer.handleUpgrade(request, socket, head, (websocket) => {
      websocketServer.emit("connection", websocket, request);
    });
  });

  server.on("close", () => {
    void subscriptionServer.dispose();
  });
}
