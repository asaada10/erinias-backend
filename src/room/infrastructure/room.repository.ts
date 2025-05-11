import { db } from "../../shared/infrastructure/db";
import { eq, and, exists, inArray } from "drizzle-orm";
import * as table from "../../shared/infrastructure/db/schema";
import Snowflake from "../../shared/infrastructure/utils/Snowflake";

export interface CreateRoomParms {
  name: string | null;
}

export class RoomRepository {
  static async create(room: CreateRoomParms): Promise<Partial<table.Room>> {
    const newRoom = await db
      .insert(table.room)
      .values({
        id: Snowflake.generate(new Date()),
        name: room?.name ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning({
        id: table.room.id,
        name: table.room.name,
        createdAt: table.room.createdAt,
        updatedAt: table.room.updatedAt,
      });
    return newRoom[0];
  }

  static async getByName(name: string): Promise<table.Room[]> {
    const room = await db
      .select()
      .from(table.room)
      .where(eq(table.room.name, name));
    return room;
  }

  static async getById(id: string): Promise<table.Room | undefined> {
    const room = await db
      .select()
      .from(table.room)
      .where(eq(table.room.id, id));
    return room[0];
  }

  static async getPrivateChat(
    userId1: string,
    userId2: string
  ): Promise<table.Room | undefined> {
    const [smallerId, largerId] = [userId1, userId2].sort();
    console.log(
      `Fetching private chat room for users: ${smallerId} and ${largerId}`
    );
    try {
    const room = await db
      .select()
      .from(table.room)
      .innerJoin(table.user_room, eq(table.user_room.roomId, table.room.id))
      .where(
        and(
          eq(table.user_room.userId, smallerId),
          exists(
            db
              .select()
              .from(table.user_room)
              .where(
                and(
                  eq(table.user_room.roomId, table.room.id),
                  eq(table.user_room.userId, largerId)
                )
              )
          )
        )
      )
      .limit(1);
      console.log("Room found:", room);
    return room[0]?.room;
    } catch (error) {
      console.error("Error fetching private chat room:", error);
      throw new Error("Error fetching private chat room");
    }
  }

  static async addUserToRoom(userId: string, roomId: string): Promise<void> {
    if (!userId) {
      throw new Error("User ID is required");
    }
    const id = Snowflake.generate(new Date());
    await db.insert(table.user_room).values({
      id,
      userId,
      roomId,
      role: "member",
      joinedAt: new Date(),
    });
  }
  

  static async getAllRooms(userId: string): Promise<{
    id: string;
    name: string | null;
    users: { id: string }[];
  }[]> {
    // Usando drizzle para obtener todas las salas y los usuarios de cada sala
    const roomsRaw = await db
      .select({
        id: table.room.id,
        name: table.room.name,
      })
      .from(table.room)
      .innerJoin(table.user_room, eq(table.user_room.roomId, table.room.id))
      .where(eq(table.user_room.userId, userId));

    // Para cada sala, obtener todos los usuarios (solo id) usando drizzle
    const roomIds = roomsRaw.map(r => r.id);
    let usersByRoom: Record<string, { id: string }[]> = {};
    if (roomIds.length > 0) {
      const usersRaw = await db
        .select({
          roomId: table.user_room.roomId,
          userId: table.user_room.userId,
        })
        .from(table.user_room)
        .where(inArray(table.user_room.roomId, roomIds));
      for (const { roomId, userId } of usersRaw) {
        if (!usersByRoom[roomId]) usersByRoom[roomId] = [];
        usersByRoom[roomId].push({ id: userId });
      }
    }

    return roomsRaw.map(room => ({
      id: room.id,
      name: room.name,
      users: usersByRoom[room.id] || [],
    }));
  }
}
