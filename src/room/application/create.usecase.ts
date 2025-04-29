import { Static, t } from "elysia";
import { RoomRepository } from "../infrastructure/room.repository";

export const CreateRoomRequestSchema = t.Object({
  name: t.Optional(t.String()),
  userIds: t.Array(t.String()), // @Todo: Incluir ellos usuairos.
  isPrivate: t.Optional(t.Boolean()),
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

export const createRoom = async (room: CreateRoomRequest) => {
  try {
    // Si es un chat privado entre dos personas, buscar primero si existe
    if (room.isPrivate && room.userIds.length === 2) {
      const existingRoom = await RoomRepository.getPrivateChat(
        room.userIds[0],
        room.userIds[1]
      );

      if (existingRoom) {
        return {
          status: "success",
          data: {
            room: {
              id: existingRoom.id,
              name: existingRoom.name,
              createdAt: existingRoom.createdAt,
              updatedAt: existingRoom.updatedAt,
            },
          },
        };
      }
    }

    // Crear la sala
    const newRoom = await RoomRepository.create({ name: room.name ?? null });

    // Agregar usuarios a la sala
    for (const userId of room.userIds) {
      await RoomRepository.addUserToRoom(userId, newRoom.id!);
    }

    return {
      status: "success",
      data: {
        room: {
          id: newRoom.id,
          name: newRoom.name,
          createdAt: newRoom.createdAt,
          updatedAt: newRoom.updatedAt,
        },
      },
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Failed to create room",
    };
  }
};
