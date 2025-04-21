import { Static, t } from "elysia";

import { UserRepository } from "../../user/infrastructure/user.repository";

export const RegisterUserRequestSchema = t.Object({
  username: t.String(),
  email: t.String(),
  password: t.String(),
  date: t.String(),
});

export const RegisteUserResponseSchema = t.Object({
  id: t.String(),
  username: t.String(),
});

export type RegisterUserRequest = Static<typeof RegisterUserRequestSchema>;
export type RegisteUserResponse = Static<typeof RegisteUserResponseSchema>;

export const registerUseCase = async (
  userData: RegisterUserRequest
): Promise<RegisteUserResponse> => {
  const existingUser = await UserRepository.getByEmail(userData.username);
  if (existingUser) {
    throw new Error("Username already exists");
  }

  userData.password = await Bun.password.hash(userData.password);
  const { id, username } = await UserRepository.create(userData);

  return {
    id: id!,
    username: username!,
  };
};
