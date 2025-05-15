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

  static async getByName(name: string): Promise<(table.Room & { users: { id: string }[] })[]> {
    const rooms = await db
      .select()
      .from(table.room)
      .where(eq(table.room.name, name));

    const roomIds = rooms.map((room) => room.id);
    const usersRaw = await db
      .select({
        roomId: table.user_room.roomId,
        userId: table.user_room.userId,
      })
      .from(table.user_room)
      .where(inArray(table.user_room.roomId, roomIds));

    const usersByRoom: Record<string, { id: string }[]> = {};
    for (const { roomId, userId } of usersRaw) {
      if (!usersByRoom[roomId]) usersByRoom[roomId] = [];
      usersByRoom[roomId].push({ id: userId });
    }

    return rooms.map((room) => ({
      ...room,
      users: usersByRoom[room.id] || [],
    }));
  }

  static async getById(id: string): Promise<(table.Room & { users: {
    id: string;
    name: string | null;
    email: string | null;
    createdAt?: Date;
    updatedAt?: Date;
  }[] }) | undefined> {
    const room = await db
      .select()
      .from(table.room)
      .where(eq(table.room.id, id))
      .limit(1);

    if (!room[0]) return undefined;

    const users = await db
      .select({
        userId: table.user_room.userId,
        name: table.user.username,
        email: table.user.email,
        createdAt: table.user.createdAt,
        updatedAt: table.user.updatedAt,
      })
      .from(table.user_room)
      .innerJoin(table.user, eq(table.user.id, table.user_room.userId))
      .where(eq(table.user_room.roomId, id));

    return {
      ...room[0],
      users: users.map((user) => ({
        id: user.userId,
        name: user.name || null, 
        email: user.email || null, 
        createdAt: user.createdAt || undefined, 
        updatedAt: user.updatedAt || undefined, 
      })),
    };
  }

  static async getPrivateChat(
    userId1: string,
    userId2: string
  ): Promise<(table.Room & { users: { id: string }[] }) | undefined> {
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

      if (!room[0]) return undefined;

      const users = await db
        .select({ userId: table.user_room.userId })
        .from(table.user_room)
        .where(eq(table.user_room.roomId, room[0].room.id));

      return {
        ...room[0].room,
        users: users.map((user) => ({ id: user.userId })),
      };
    } catch (error) {
      console.error("Error fetching private chat room:", error);
      throw new Error("Error fetching private chat room");
    }
  }

  static async addUserToRoom(userId: string, roomId: string): Promise<void> {
    if (!userId) {
      throw new Error("User ID is required");
    }

    // Verificar si el usuario existe
    const userExists = await db
      .select()
      .from(table.user)
      .where(eq(table.user.id, userId))
      .limit(1);

    if (userExists.length === 0) {
      throw new Error(`User with ID ${userId} does not exist`);
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
    users: { 
      id: string;
      name: string | null;
      email: string | null;
      createdAt?: Date;
      updatedAt?: Date;
     }[];
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
    const roomIds = roomsRaw.map((r) => r.id);
    let usersByRoom: Record<string, { id: string; name?: string; email?: string; createdAt?: Date; updatedAt?: Date }[]> = {};
    if (roomIds.length > 0) {
      const usersRaw = await db
        .select({
          roomId: table.user_room.roomId,
          userId: table.user_room.userId,
          name: table.user.username,
          email: table.user.email,
          createdAt: table.user.createdAt,
          updatedAt: table.user.updatedAt,
        })
        .from(table.user_room)
        .innerJoin(table.user, eq(table.user.id, table.user_room.userId))
        .where(inArray(table.user_room.roomId, roomIds));
      for (const { roomId, userId, name, email, createdAt, updatedAt } of usersRaw) {
        if (!usersByRoom[roomId]) usersByRoom[roomId] = [];
        usersByRoom[roomId].push({ 
          id: userId, 
          name, 
          email, 
          createdAt: createdAt || undefined, 
          updatedAt: updatedAt || undefined 
        });
      }
    }

    return roomsRaw.map((room) => ({
      id: room.id,
      name: room.name,
      users: (usersByRoom[room.id] || []).map((user) => ({
        id: user.id,
        name: user.name || null, // Asegurar que `name` sea nulo si no está definido
        email: user.email || null, // Asegurar que `email` sea nulo si no está definido
        createdAt: user.createdAt || undefined, // Asegurar que `createdAt` sea undefined si no está definido
        updatedAt: user.updatedAt || undefined, // Asegurar que `updatedAt` sea undefined si no está definido
      })),
    }));
  }
}
