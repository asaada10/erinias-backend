import Elysia, { t } from "elysia";
import {
  searchUseCase,
  SearchRoomRequestSchema,
  SearchRoomResponseSchema,
} from "../application/search.usecase";
import {
  createRoom,
  CreateRoomRequestSchema,
  CreateRoomResponseSchema,
  CreateRoomErrorSchema,
} from "../application/create.usecase";
import {
  getRoom,
  GetRoomRequestSchema,
  GetRoomResponseSchema,
  GetRoomErrorSchema,
} from "../application/index.usecase";
import {
  getAllRooms,
  GetAllRoomsResponseSchema,
  GetAllRoomsErrorSchema,
} from "../application/all.usecase";

export const RoomController = new Elysia().group("/room", (app) =>
  app
    .get(
      "/",
      async ({ params, set }) => {
        try {
          const result = await getRoom(params.id);
          set.status = 200;
          return result;
        } catch (error) {
          set.status = 404;
          return {
            status: "error",
            message: error instanceof Error ? error.message : "Room not found",
          };
        }
      },
      {
        params: t.Object({
          id: t.String(),
        }),
        response: {
          200: GetRoomResponseSchema,
          404: GetRoomErrorSchema,
        },
        detail: {
          tags: ["Room"],
          summary: "Get a room by ID",
          description: "Retrieve a room by its unique identifier",
        },
      }
    )
    .get(
      "/:id",
      async ({ params, set }) => {
        try {
          const result = await getRoom(params.id);
          set.status = 200;
          return result;
        } catch (error) {
          set.status = 404;
          return {
            status: "error",
            message: error instanceof Error ? error.message : "Room not found",
          };
        }
      },
      {
        params: GetRoomRequestSchema,
        response: {
          200: GetRoomResponseSchema,
          404: GetRoomErrorSchema,
        },
        detail: {
          tags: ["Room"],
          summary: "Get a room by ID",
          description: "Retrieve a room by its unique identifier",
        },
      }
    )
    .get(
      "/all",
      async ({ set, request }) => {
        try {
          const data = await getAllRooms(request.headers.get("x-user-id")!);
          set.status = 200;
          return data; // Devuelve directamente el objeto esperado
        } catch (error) {
          set.status = 400;
          return {
            message: error instanceof Error ? error.message : "Unknown error"
          };
        }
      },
      {
        response: {
          200: GetAllRoomsResponseSchema,
          400: GetAllRoomsErrorSchema,
        },
        detail: {
          tags: ["Room"],
          summary: "Get all rooms for a user",
          description: "Retrieve all rooms for a user",
        },
      }
    )
    .post(
      "/search",
      async ({ body, set }) => {
        try {
          const results = await searchUseCase({
            name: body?.name,
            id: body?.id,
          });
          set.status = 200;
          return { status: "success", data: { rooms: results.rooms } };
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: error instanceof Error ? error.message : "Search failed",
          };
        }
      },
      {
        body: SearchRoomRequestSchema,
        response: {
          200: t.Object({
            status: t.Literal("success"),
            data: SearchRoomResponseSchema,
          }),
          400: t.Object({
            status: t.Literal("error"),
            message: t.String(),
          }),
        },
        detail: {
          tags: ["Room"],
          summary: "Search a room",
          description: "Search a room by name or id",
        },
      }
    )
    .post(
      "/create",
      async ({ body, set, request }) => {
        try {
          const userId = request.headers.get("x-user-id");
          const result = await createRoom(body, userId!);
          console.log({ status: "success", data: { room: result } }); // Modificado
          set.status = 201;
          return { status: "success", data: { room: result } }; // Envuelve en data.room
        } catch (error) {
          set.status = 500;
          return {
            status: "error",
            message: error instanceof Error ? error.message : "Failed to create room",
          };
        }
      },
      {
        body: CreateRoomRequestSchema,
        response: {
          201: CreateRoomResponseSchema,
          500: CreateRoomErrorSchema,
        },
        detail: {
          tags: ["Room"],
          summary: "Create a new room",
          description: "Create a new room with specified ID and name",
        },
      }
    )
);
