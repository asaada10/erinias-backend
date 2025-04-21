import Elysia, { t } from "elysia";
import {
  searchUseCase,
  SearchUserRequestSchema,
  SearchUserResponseSchema,
} from "../application/search.usecase";

export const UserController = new Elysia().group("/user", (app) =>
  app.post(
    "/search",
    async ({ body, set }) => {
      try {
        const results = await searchUseCase({
          username: body?.username,
          id: body?.id,
        });
        set.status = 200;
        return { status: "success", data: { users: results.users } };
      } catch (error) {
        set.status = 500;
        return {
          status: "error",
          message: error instanceof Error ? error.message : "Search failed",
        };
      }
    },
    {
      body: SearchUserRequestSchema,
      response: {
        200: t.Object({
          status: t.Literal("success"),
          data: SearchUserResponseSchema,
        }),
        400: t.Object({
          status: t.Literal("error"),
          message: t.String(),
        }),
      },
      detail: {
        tags: ["User"],
        summary: "Search a user",
        description: "Search a user by username or id",
      },
    }
  )
);
