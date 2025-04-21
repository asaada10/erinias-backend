import { Static, t } from "elysia";
import { RoomRepository } from "../infrastructure/room.repository";

export const SearchRoomRequestSchema = t.Object({
  name: t.Optional(t.String()),
  id: t.Optional(t.String()),
});

export const SearchRoomResponseSchema = t.Object({
  rooms: t.Array(
    t.Object({
      name: t.Nullable(t.String()),
      id: t.String(),
      createdAt: t.Date(),
      updatedAt: t.Date(),
      domainId: t.Nullable(t.String()),
    })
  ),
});
export type SearchUserRequest = Partial<Static<typeof SearchRoomRequestSchema>>;
export type SearchUserResponse = Static<typeof SearchRoomResponseSchema>;

export const searchUseCase = async (room: SearchUserRequest) => {
  const rooms = [];
  if (room.name) {
    const results = await RoomRepository.getByName(room.name);
    if (results) {
      rooms.push(...results);
    }
  }
  if (room.id) {
    const results = await RoomRepository.getById(room.id);
    if (results) {
      rooms.push(results);
    }
  }
  return {
    rooms: rooms.map((room) => ({
      name: room.name!,
      id: room.id,
      createdAt: room.createdAt!,
      updatedAt: room.updatedAt!,
      domainId: room.domainId!,
    })),
  };
};
