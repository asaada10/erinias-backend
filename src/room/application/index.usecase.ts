import { Static, t } from "elysia";
import { RoomRepository } from "../infrastructure/room.repository";

export const GetRoomRequestSchema = t.Object({
  id: t.String(),
});

export const GetRoomResponseSchema = t.Object({
  status: t.Literal("success"),
  data: t.Object({
    room: t.Object({
      id: t.String(),
      name: t.Optional(t.Union([t.String(), t.Null()])),
      createdAt: t.Date(),
      updatedAt: t.Date(),
      domainId: t.Optional(t.Union([t.String(), t.Null()])),
      users: t.Array(
        t.Object({
          id: t.String(),
          name: t.Optional(t.Union([t.String(), t.Null()])),
          email: t.Optional(t.Union([t.String(), t.Null()])),
          createdAt: t.Optional(t.Union([t.Date(), t.Null()])),
          updatedAt: t.Optional(t.Union([t.Date(), t.Null()])),
        })
      ),
    }),
  }),
});

export type GetRoomRequest = Static<typeof GetRoomRequestSchema>;
export type GetRoomResponse = Static<typeof GetRoomResponseSchema>;

export const GetRoomErrorSchema = t.Object({
  status: t.Literal("error"),
  message: t.String(),
});

export const getRoom = async (id: string): Promise<GetRoomResponse> => {
    const room = await RoomRepository.getById(id);
    if (!room) {
      throw new Error("Room not found");
    }
    return {
      status: "success",
      data: {
        room: {
          id: room.id,
          name: room.name ?? null,
          createdAt: room.createdAt ?? new Date(),
          updatedAt: room.updatedAt ?? new Date(),
          domainId: room.domainId!,
          users: room.users.map((user) => ({
            id: user.id,
            name: user.name ?? null,
            email: user.email ?? null,
            createdAt: user.createdAt ?? null,
            updatedAt: user.updatedAt ?? null,
          })),
        }
      }
    };
};
