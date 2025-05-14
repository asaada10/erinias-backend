import { Static, t } from "elysia";
import { RoomRepository } from "../infrastructure/room.repository";

export const GetAllRoomsResponseSchema = t.Object({
  data: t.Object({
    rooms: t.Array(
      t.Object({
        id: t.String(),
        name: t.String(), // Asegurar que `name` sea una cadena no nula
        users: t.Array(
          t.Object({
            id: t.String(),
            name: t.String(), // Asegurar que `name` sea una cadena no nula
            email: t.Nullable(t.String()),
            createdAt: t.Date(),
            updatedAt: t.Date(),
          })
        ),
      })
    ),
  }),
});

export const GetAllRoomsErrorSchema = t.Object({
  message: t.String(),
});

export type GetAllRoomsResponse = Static<typeof GetAllRoomsResponseSchema>;
export type GetAllRoomsError = Static<typeof GetAllRoomsErrorSchema>;

export const getAllRooms = async (userId: string | undefined) => {
  const rooms = await RoomRepository.getAllRooms(userId ?? "");
  return {
    data: {
      rooms: rooms.map((room) => ({
        id: room.id,
        name: room.name || "", // Asegurar que `name` sea una cadena no nula
        users: room.users.map((user) => ({
          id: user.id,
          name: user.name || "", // Asegurar que `name` sea una cadena no nula
          email: user.email || null, // Asegurar que `email` sea nulo si no está definido
          createdAt: user.createdAt || new Date(), // Proveer fecha actual si falta
          updatedAt: user.updatedAt || new Date(), // Proveer fecha actual si falta
        })),
      })),
    },
  };
};
