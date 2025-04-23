import { Static, t } from "elysia";
import { UserRepository } from "../infrastructure/user.repository";

export const UpdateProfileRequestSchema = t.Object({
  userId: t.String(),
  username: t.Optional(t.String()),
  avatar: t.Optional(t.String()),
  role: t.Optional(t.String()),
});

export const UpdateProfileResponseSchema = t.Object({
  username: t.String(),
  id: t.String(),
  avatar: t.Nullable(t.String()),
  createdAt: t.Date(),
  isActive: t.Boolean(),
  role: t.String(),
});

export type UpdateProfileRequest = Static<typeof UpdateProfileRequestSchema>;
export type UpdateProfileResponse = Static<typeof UpdateProfileResponseSchema>;

export const updateProfileUseCase = async (
  request: UpdateProfileRequest
): Promise<UpdateProfileResponse> => {
  try {
    const { userId, ...updates } = request;

    const user = await UserRepository.getById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Actualizar los campos que se hayan proporcionado
    if (updates.username !== undefined) {
      user.username = updates.username;
    }
    if (updates.avatar !== undefined) {
      user.avatar = updates.avatar;
    }
    if (updates.role !== undefined) {
      user.role = updates.role;
    }

    await UserRepository.update(user);
    return UserRepository.toProfile(user);
  } catch (error) {
    throw error;
  }
};
