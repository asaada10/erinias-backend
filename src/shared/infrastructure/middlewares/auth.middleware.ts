import { Elysia } from "elysia";
import Token from "../db/token";

export const authMiddleware = (app: Elysia) =>
  app.guard({
    beforeHandle: async ({ request, set, headers }) => {
      const path = new URL(request.url).pathname;
      // Excluir rutas de autenticación
      if (path === "/v1/auth/login" || path === "/v1/auth/register") {
        return;
      }

      const authHeader = headers["authorization"];
      const accessToken = authHeader?.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : null;
      const refreshToken = headers["x-refresh-token"];

      if (!accessToken) {
        set.status = 401;
        return { status: "error", message: "Missing access token" };
      }

      try {
        const payload = await Token.validate(accessToken, "access");
        if (!payload) {
          set.status = 401;
          return { status: "error", message: "Invalid access token" };
        }
      } catch (error) {
        if (error instanceof Error && error.name === "JWTExpired") {
          if (!refreshToken) {
            set.status = 401;
            return { status: "error", message: "Access token expired" };
          }

          try {
            const newTokens = await Token.renewTokens(refreshToken, headers);
            if (!newTokens) {
              set.status = 401;
              return { status: "error", message: "Invalid refresh token" };
            }

            set.headers["authorization"] = `Bearer ${newTokens.accessToken}`;
            set.headers["x-refresh-token"] = newTokens.refreshToken;
          } catch (refreshError) {
            set.status = 401;
            return { status: "error", message: "Failed to refresh tokens" };
          }
        } else {
          set.status = 401;
          return { status: "error", message: "Invalid token" };
        }
      }
    },
  });
