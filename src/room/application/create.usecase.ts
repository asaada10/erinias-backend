import { Static, t } from "elysia";
import { RoomRepository } from "../infrastructure/room.repository";
import { InternalServerError } from "../../shared/infrastructure/errors";

export const CreateRoomRequestSchema = t.Object({
  name: t.Nullable(t.String()),
  userIds: t.Array(t.String()), // @Todo: Incluir ellos usuairos.
});

export const CreateRoomResponseSchema = t.Object({
  status: t.Literal("success"),
  data: t.Object({
  room: t.Object({
    id: t.String(),
    name: t.Nullable(t.String()),
    createdAt: t.Date(),
    updatedAt: t.Date(),
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
    // Si es un chat privado entre dos personas, buscar primero si existe
    if ([userId, ...room.userIds].length === 2) {
      const existingRoom = await RoomRepository.getPrivateChat(
        userId,
        room.userIds[0]
      );

      if (existingRoom) {
        return {
          room: {
            id: existingRoom.id,
            name: existingRoom.name,
            createdAt: existingRoom.createdAt,
            updatedAt: existingRoom.updatedAt,
          },
        };
      }
    }
    // Crear la sala
    const newRoom = await RoomRepository.create({ name: room.name ?? null });

    // Agregar usuarios a la sala
    for (const user of new Set([userId, ...room.userIds])) {
      await RoomRepository.addUserToRoom(user, newRoom.id!);
    }

    // Ensure all required fields are returned
    return {
      room: {
        id: newRoom.id!,
        name: newRoom.name ?? null,
        createdAt: newRoom.createdAt!,
        updatedAt: newRoom.updatedAt!,
      },
    };
  } catch (error) {
    console.log(error);
    throw new InternalServerError(); // Throw error instead of returning status
  }
};
