import { Elysia, t } from "elysia";
import {
  searchUseCase,
  SearchUserRequestSchema,
  SearchUserResponseSchema,
} from "../application/search.usecase";
import {
  updateProfileUseCase,
  UpdateProfileRequestSchema,
} from "../application/update.usecase";
import { UserRepository } from "../infrastructure/user.repository";
import { getProfileUseCase, ProfileResponseSchema } from "../application/profile.usecase";

export const UserController = new Elysia().group("/user", (app) =>
  app
    .post(
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
    .get(
      "/profile",
      async ({ request, set }) => {
        try {
          const userId = request.headers.get("x-user-id");
          const data = await getProfileUseCase(userId!);

          return {
            status: "success",
            data, // Ensure 'profile' is directly under 'data'
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message:
              error instanceof Error ? error.message : "Get profile failed",
          };
        }
      },
      {
        response: {
          200: ProfileResponseSchema,
          401: t.Object({
            status: t.Literal("error"),
            message: t.String(),
          }),
          404: t.Object({
            status: t.Literal("error"),
            message: t.String(),
          }),
          500: t.Object({
            status: t.Literal("error"),
            message: t.String(),
          }),
        },
        detail: {
          tags: ["User"],
          summary: "Get user profile",
          description: "Get the current user's profile information",
        },
      }
    )
    .put(
      "/update",
      async ({ body, headers, set }) => {
        try {
          const updatedProfile = await updateProfileUseCase({
            userId: body.userId,
            username: body?.username,
            avatar: body?.avatar,
            role: body?.role,
          });
          set.status = 200;
          return {
            status: "success",
            data: updatedProfile,
          };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message:
              error instanceof Error ? error.message : "Update profile failed",
          };
        }
      },
      {
        body: UpdateProfileRequestSchema,
        response: {
          200: t.Object({
            status: t.Literal("success"),
            data: t.Object({
              username: t.String(),
              id: t.String(),
              avatar: t.Nullable(t.String()),
              createdAt: t.Date(),
              isActive: t.Boolean(),
              role: t.String(),
            }),
          }),
          401: t.Object({
            status: t.Literal("error"),
            message: t.String(),
          }),
          404: t.Object({
            status: t.Literal("error"),
            message: t.String(),
          }),
          500: t.Object({
            status: t.Literal("error"),
            message: t.String(),
          }),
        },
        detail: {
          tags: ["User"],
          summary: "Update user profile",
          description: "Update the current user's profile information",
        },
      }
    )
);
