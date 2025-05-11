import { Static, t } from "elysia";
import { RoomRepository } from "../infrastructure/room.repository";

export const GetAllRoomsResponseSchema = t.Object({
  data: t.Object({
    rooms: t.Array(
      t.Object({
        id: t.String(),
        name: t.Nullable(t.String()),
        users: t.Array(
          t.Object({
            id: t.String(),
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
    rooms: rooms.map((room) => ({
      id: room.id,
      name: room.name,
      users: room.users.map((user) => ({ id: user.id })),
    })),
  };
};
