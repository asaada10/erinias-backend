import { Context, CookieOptions, Static, t } from "elysia";
import Token from "../../shared/infrastructure/db/token";

export const RefreshUserResponseSchema = t.Object({
  message: t.String(),
});

export type RefreshUserResponse = Static<typeof RefreshUserResponseSchema>;

export const refreshUseCase = async (
  headers: Context["headers"],
  cookie: Context["cookie"]
): Promise<RefreshUserResponse> => {
  const token = await Token.renewTokens(cookie["refreshToken"].value!, headers);

  if (!token) {
    throw new Error("Invalid or expired refresh token");
  }

  const secure = Bun.env.NODE_ENV === "production";

  const commonCookieOptions: CookieOptions = {
    path: "/",
    httpOnly: true,
    sameSite: "strict",
    secure,
  };

  cookie["refresh_token"].set({
    value: token.refreshToken,
    ...commonCookieOptions,
    maxAge: Token.getExpiryInMs(Token.REFRESH_EXPIRY),
  });

  cookie["access_token"].set({
    value: token.accessToken,
    ...commonCookieOptions,
  });

  return { message: "Token refreshed" };
};
