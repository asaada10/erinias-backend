import { Elysia } from "elysia";
import Token from "../db/token";
import { CookieOptions } from "elysia";

export const authMiddleware = (app: Elysia) =>
  app.guard({
    beforeHandle: async ({ request, set, cookie, headers }) => {
      const path = new URL(request.url).pathname;
      // Excluir rutas de autenticación
      if (path === "/v1/auth/login" || path === "/v1/auth/register") {
        return;
      }

      // Obtener tokens de las cookies
      const accessToken = cookie.access_token?.value;
      const refreshToken = cookie.refresh_token?.value;

      if (!accessToken || !(await Token.validate(accessToken, "access"))) {
        // Si no hay access token, generar un nuevo par de tokens
        try {
          const newTokens = await Token.renewTokens(refreshToken!, headers);
          
          if(!newTokens) {
            set.status = 401;
            return { status: "error", message: "Failed to generate new tokens" };
          }
          // Configurar las cookies con los nuevos tokens
          const commonCookieOptions: CookieOptions = {
            path: "/",
            httpOnly: true,
            sameSite: "none" as const,
            secure: true,
          };

          cookie["access_token"].set({
            value: newTokens.accessToken,
            ...commonCookieOptions,
            maxAge: 15 * 60, // 15 minutos
          });

          cookie["refresh_token"].set({
            value: newTokens.refreshToken,
            ...commonCookieOptions,
            maxAge: 30 * 24 * 60 * 60, // 30 días
          });
        } catch (error) {
          set.status = 401;
          return { status: "error", message: "Failed to generate new tokens" };
        }
      }
      const newPayload = await Token.validate(cookie.access_token?.value!, "access");
      if (newPayload) { 
        request.headers.set("x-user-id", newPayload.userId);
        return;

      } else {
        set.status = 401;
        return { status: "error", message: "Failed to generate new tokens" };
      }
    },
  });
