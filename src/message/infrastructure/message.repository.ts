import { db } from "../../shared/infrastructure/db";
import * as table from "../../shared/infrastructure/db/schema";
import { eq, desc, gt, and } from "drizzle-orm";
import Snowflake from "../../shared/infrastructure/utils/Snowflake";
import {
  CreateMessageRequest,
  GetMessagesRequest,
  CreateMessageResponse,
  GetMessagesResponse,
} from "../application/message.usecase";

export class MessageRepository {
  static async create(roomId: string, message: CreateMessageRequest): Promise<CreateMessageResponse["data"]["message"]> {
    // Validate if the roomId exists
    const roomExists = await db
      .select()
      .from(table.room)
      .where(eq(table.room.id, roomId))
      .limit(1);

    if (roomExists.length === 0) {
      throw new Error(`Room with ID ${roomId} does not exist.`);
    }

    const id = Snowflake.generate(new Date());
    const newMessage = await db
      .insert(table.message)
      .values({
        id,
        content: message.content,
        authorId: message.authorId,
        channelId: roomId,
        createdAt: new Date(),
        updatedAt: new Date(),
        edited: false,
      })
      .returning();

    return newMessage[0];
  }

  static async getMessages(
    roomId: string,
    params: GetMessagesRequest,
  ): Promise<GetMessagesResponse["data"]["messages"]> {
    const conditions = [eq(table.message.channelId, roomId)];
    const query = db
      .select()
      .from(table.message)
      
    if (params.cursor) {
      conditions.push(gt(table.message.id, params.cursor));
    }

    if (params.limit) {
      if(params.limit > 100) {
        params.limit = 100;
      }
      if(params.limit < 0) {
        params.limit = 0;
      }
      query.limit(params.limit);
    }

    const messages = await query
      .where(and(...conditions))
      .orderBy(desc(table.message.createdAt));

    return messages;
  }
}

