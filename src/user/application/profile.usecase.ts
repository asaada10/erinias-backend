import { Static, t } from "elysia";
import { UserRepository } from "../infrastructure/user.repository";

export const ProfileRequestSchema = t.Object({
  userId: t.String(),
});

export const ProfileResponseSchema = t.Object({
  username: t.String(),
  id: t.String(),
  avatar: t.Nullable(t.String()),
  createdAt: t.Date(),
  isActive: t.Boolean(),
  role: t.String(),
});

export type ProfileRequest = Static<typeof ProfileRequestSchema>;
export type ProfileResponse = Static<typeof ProfileResponseSchema>;

export const getProfileUseCase = async (request: ProfileRequest): Promise<ProfileResponse> => {
  try {
    const user = await UserRepository.getById(request.userId);
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
