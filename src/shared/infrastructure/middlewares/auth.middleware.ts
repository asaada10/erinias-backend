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

      if (!accessToken) {
        set.status = 401;
        return { status: "error", message: "Missing access token" };
      }

      try {
        // Intentar validar el token de acceso
        const payload = await Token.validate(accessToken, "access");
        if (payload) {
          // Adjuntar la información decodificada a la request (usando headers como workaround)
          set.headers["x-user-id"] = payload.id as string;
          set.headers["x-user-username"] = payload.username as string;
          set.headers["x-user-role"] = payload.role as string;
          // Puedes añadir más campos si lo necesitas
          return; // Token válido, continuar con la petición
        }
      } catch (error) {
        // Si el token de acceso falla, intentar usar el refresh token
        if (!refreshToken) {
          set.status = 401;
          return { status: "error", message: "No refresh token available" };
        }

        try {
          // Validar el refresh token
          const refreshPayload = await Token.validate(refreshToken, "refresh");
          if (!refreshPayload) {
            set.status = 401;
            return { status: "error", message: "Invalid refresh token" };
          }

          // Generar nuevos tokens
          const newTokens = await Token.renewTokens(refreshToken, headers);
          if (!newTokens) {
            set.status = 401;
            return {
              status: "error",
              message: "Failed to generate new tokens",
            };
          }

          // Actualizar las cookies con los nuevos tokens
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

          // Decodificar el nuevo access token y adjuntar la info
          const newPayload = await Token.validate(newTokens.accessToken, "access");
          if (newPayload) {
            set.headers["x-user-id"] = newPayload.id as string;
            set.headers["x-user-username"] = newPayload.username as string;
            set.headers["x-user-role"] = newPayload.role as string;
          }

          // Continuar con la petición
          return;
        } catch (refreshError) {
          set.status = 401;
          return { status: "error", message: "Failed to refresh tokens" };
        }
      }
    },
  });
