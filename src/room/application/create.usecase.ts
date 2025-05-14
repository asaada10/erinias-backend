import { Static, t } from "elysia";
import { RoomRepository } from "../infrastructure/room.repository";
import { InternalServerError } from "../../shared/infrastructure/errors";

export const CreateRoomRequestSchema = t.Object({
  name: t.Nullable(t.String()),
  userIds: t.Array(t.String()), 
});

export const CreateRoomResponseSchema = t.Object({
  status: t.Literal("success"),
  data: t.Object({
    room: t.Object({
      id: t.String(),
      name: t.Nullable(t.String()),
      createdAt: t.Date(),
      updatedAt: t.Date(),
      users: t.Array(
        t.Object({
          id: t.String(),
          name: t.Optional(t.String()),
          email: t.Optional(t.String()),
          createdAt: t.Optional(t.Date()),
          updatedAt: t.Optional(t.Date()),
        })
      ),
    }),
  }),
});

export const CreateRoomErrorSchema = t.Object({
  status: t.Literal("error"),
  message: t.String(),
});

export type CreateRoomRequest = Static<typeof CreateRoomRequestSchema>;
export type CreateRoomResponse = Static<typeof CreateRoomResponseSchema>;
export type CreateRoomError = Static<typeof CreateRoomErrorSchema>;

export const createRoom = async (room: CreateRoomRequest, userId: string) => {
  try {
    if (room.userIds.length === 2) {
      const existingRoom = await RoomRepository.getPrivateChat(room.userIds[0], room.userIds[1]);

      if (existingRoom) {
        return {
              id: existingRoom.id,
              name: existingRoom.name,
              createdAt: existingRoom.createdAt,
              updatedAt: existingRoom.updatedAt,
              users: existingRoom.users,
        };
      }
    }

    const newRoom = await RoomRepository.create({ name: room.name ?? null });

    for (const user of new Set([userId, ...room.userIds])) {
      await RoomRepository.addUserToRoom(user, newRoom.id!);
    }

    const users = await RoomRepository.getById(newRoom.id!);

    return {
          id: newRoom.id!,
          name: newRoom.name ?? null,
          createdAt: newRoom.createdAt!,
          updatedAt: newRoom.updatedAt!,
          users: users?.users.map((user) => ({
            id: user.id,
            name: user.name, 
            email: user.email, 
            createdAt: user.createdAt, 
            updatedAt: user.updatedAt, 
          })) || [],
    };
  } catch (error) {
    console.log(error);
    throw new InternalServerError();
  }
};
