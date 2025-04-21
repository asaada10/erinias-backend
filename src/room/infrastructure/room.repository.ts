import { db } from "../../shared/infrastructure/db";
import { eq, and, exists } from "drizzle-orm";
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
      .returning({ id: table.room.id, username: table.room.name });
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

  static async getPrivateChat(userId1: string, userId2: string): Promise<table.Room | undefined> {
    const [smallerId, largerId] = [userId1, userId2].sort();
    
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

    return room[0]?.room;
  }

  static async addUserToRoom(userId: string, roomId: string): Promise<void> {
    const id = Snowflake.generate(new Date());
    await db.insert(table.user_room).values({
      id,
      userId,
      roomId,
      role: "member",
      joinedAt: new Date()
    });
  }
}
