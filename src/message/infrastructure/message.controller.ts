import Elysia from "elysia";
import {
  getMessages,
  GetMessagesRequestSchema,
  GetMessagesResponseSchema,
  GetMessagesErrorSchema,
} from "../application/message.usecase";

export const MessageController = new Elysia().group("/room/:id/message", (app) =>
  app
    .get(
      "/",
      async ({ query, set, params }) => {
        try {
          const result = await getMessages(params.id, query);
          set.status = 200;
          return {
            status: "success" as const,
            data: {
              messages: result.data?.messages ?? [],
              cursor: result.data?.cursor
            }
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error" as const,
            message: error instanceof Error ? error.message : "Failed to get messages",
          };
        }
      },
      {
        query: GetMessagesRequestSchema,
        response: {
          200: GetMessagesResponseSchema,
          400: GetMessagesErrorSchema,
        },
        detail: {
          tags: ["Message"],
          summary: "Get messages from a room",
          description: "Get messages from the specified room with pagination support",
        },
      }
    )
);
