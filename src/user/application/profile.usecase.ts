import { Static, t } from "elysia";
import { UserRepository } from "../infrastructure/user.repository";



export const ProfileResponseSchema = t.Object({
  status: t.Literal("success"),
  data: t.Object({
    profile: t.Object({
  username: t.String(),
  id: t.String(),
  avatar: t.Nullable(t.String()),
  createdAt: t.Date(),
  isActive: t.Boolean(),
  role: t.String(),
}),
  }),
});

export type ProfileResponse = Static<typeof ProfileResponseSchema>;

export const getProfileUseCase = async (userId: string) => {
  try {
    const user = await UserRepository.getById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    return {
      username: user.username,
      id: user.id,
      avatar: user.avatar,
      createdAt: user.createdAt ?? new Date(),
      isActive: user.isActive ?? true,
      role: user.role ?? "user",
    };
  } catch (error) {
    throw error;
  }
};
