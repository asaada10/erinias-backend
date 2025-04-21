import { Context } from "elysia";
import Token from "../shared/infrastructure/db/token";

export async function authHook({ cookie, error }: Context) {
  const sessionToken = cookie.session;
  const refreshToken = cookie["refresh_token"];
  if (!refreshToken && (await Token.validate(refreshToken, "refresh"))) {
    return error(400, "No refresh token provided");
  }

  if (!sessionToken) {
    return error(401, "Acceso denegado. Se requiere iniciar sesión.");
  }

  return true;
}

// import '$lib/server/ws';

// const paraglideHandle: Handle = ({ event, resolve }) => {
//   const clonedRequest = event.request.clone();

// return paraglideMiddleware(clonedRequest, ({ locale }) => {
//   return resolve(event, {
//     transformPageChunk: ({ html }) => html.replace("%lang%", locale),
//   });
// });
// };
