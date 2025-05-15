import { Context, t, Static } from "elysia";

export const LogoutUserResponseSchema = t.Object({
  message: t.String(),
});

export type LogoutUserResponse = Static<typeof LogoutUserResponseSchema>;

export const logoutUseCase = async (
  cookie: Context["cookie"]
): Promise<LogoutUserResponse> => {
  cookie["refresh_token"].remove();
  cookie["access_token"].remove();
  return { message: "Logout successful" };
};
