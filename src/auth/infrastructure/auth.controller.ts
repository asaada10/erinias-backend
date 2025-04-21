import Elysia, { t } from "elysia";

import {
  loginUseCase,
  LoginUserRequestSchema,
  LoginUserResponseSchema,
} from "../application/login.usecase";
import {
  registerUseCase,
  RegisterUserRequestSchema,
  RegisteUserResponseSchema,
} from "../application/register.usecase";
import {
  refreshUseCase,
  RefreshUserResponseSchema,
} from "../application/refresh.usecase";
import { otkUseCase, OtkUserResponseSchema } from "../application/otk.usecase";
import { AppError } from "../../shared/infrastructure/errors";
import Base62 from "../../shared/infrastructure/utils/Base62";
import Snowflake from "../../shared/infrastructure/utils/Snowflake";

export const AuthController = new Elysia().group("/auth", (app) =>
  app
    .post(
      "/register",
      async ({ body, set }) => {
        try {
          const newUser = await registerUseCase(body);
          set.status = 201;
          return { status: "success", data: newUser };
        } catch (error) {
          set.status = error instanceof AppError ? error.statusCode : 400;
          console.log(error, Snowflake.recoverTimestamp("VYRo00"));

          return {
            status: "error",
            message:
              error instanceof Error ? error.message : "Registration failed",
          };
        }
      },
      {
        body: RegisterUserRequestSchema,
        response: {
          201: t.Object({
            status: t.Literal("success"),
            data: RegisteUserResponseSchema,
          }),
          400: t.Object({
            status: t.Literal("error"),
            message: t.String(),
          }),
        },
        detail: {
          tags: ["Auth"],
          summary: "Register a new user",
          description: "Create a new user account",
        },
      }
    )
    .post(
      "/login",
      async ({ body, set, headers, cookie }) => {
        try {
          const { user } = await loginUseCase(
            {
              email: body.email,
              password: body.password,
            },
            headers,
            cookie
          );
          return { status: "success", data: { user } };
        } catch (error) {
          set.status = error instanceof AppError ? error.statusCode : 401;
          return {
            status: "error",
            message:
              error instanceof Error ? error.message : "Authentication failed",
          };
        }
      },
      {
        body: LoginUserRequestSchema,
        response: {
          200: t.Object({
            status: t.Literal("success"),
            data: LoginUserResponseSchema,
          }),
          401: t.Object({
            status: t.Literal("error"),
            message: t.String(),
          }),
        },
        detail: {
          tags: ["Auth"],
          summary: "User login",
          description: "Authenticate a user",
        },
      }
    )
    .post(
      "/otk",
      async ({ set, headers, cookie }) => {
        try {
          const { otk } = await otkUseCase(headers, cookie);
          return { status: "success", data: { otk } };
        } catch (error) {
          set.status = error instanceof AppError ? error.statusCode : 401;
          return {
            status: "error",
            message:
              error instanceof Error ? error.message : "Authentication failed",
          };
        }
      },
      {
        response: {
          200: t.Object({
            status: t.Literal("success"),
            data: OtkUserResponseSchema,
          }),
          401: t.Object({
            status: t.Literal("error"),
            message: t.String(),
          }),
        },
        detail: {
          tags: ["Auth"],
          summary: "One-Time Token",
          description: "Generate a One-Time Token for short time validation",
        },
      }
    )
    .post(
      "/refresh",
      async ({ set, headers, cookie }) => {
        try {
          const { message } = await refreshUseCase(headers, cookie);
          return { status: "success", data: { message } };
        } catch (error) {
          set.status = error instanceof AppError ? error.statusCode : 400;
          return {
            status: "error",
            message:
              error instanceof Error ? error.message : "Authentication failed",
          };
        }
      },
      {
        response: {
          200: t.Object({
            status: t.Literal("success"),
            data: RefreshUserResponseSchema,
          }),
          401: t.Object({
            status: t.Literal("error"),
            message: t.String(),
          }),
        },
        detail: {
          tags: ["Auth"],
          summary: "Refresh Token",
          description: "Generate a new access and refresh token",
        },
      }
    )
);
