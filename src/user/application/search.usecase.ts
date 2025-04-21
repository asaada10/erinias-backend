import { Static, t } from "elysia";
import { UserRepository } from "../infrastructure/user.repository";

export const SearchUserRequestSchema = t.Object({
  username: t.Optional(t.String()),
  id: t.Optional(t.String()),
});

export const SearchUserResponseSchema = t.Object({
  users: t.Array(
    t.Object({
      username: t.String(),
      id: t.String(),
      avatar: t.Nullable(t.String()),
      createdAt: t.Date(),
      isActive: t.Boolean(),
      role: t.Nullable(t.String()),
    })
  ),
});
export type SearchUserRequest = Partial<Static<typeof SearchUserRequestSchema>>;
export type SearchUserResponse = Static<typeof SearchUserResponseSchema>;

export const searchUseCase = async (user: SearchUserRequest) => {
  const users = [];
  if (user.username) {
    const results = await UserRepository.getByUsername(user.username);
    if (results) {
      users.push(...results);
    }
  }
  if (user.id) {
    const results = await UserRepository.getById(user.id);
    if (results) {
      users.push(results);
    }
  }
  return {
    users: users.map((user) => ({
      username: user.username,
      id: user.id,
      avatar: user.avatar,
      createdAt: user.createdAt!,
      isActive: user.isActive ?? false,
      role: user.role,
    })),
  };
};
