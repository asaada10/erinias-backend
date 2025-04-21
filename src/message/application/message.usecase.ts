import { Static, t } from "elysia";
import { MessageRepository } from "../infrastructure/message.repository";

export const CreateMessageRequestSchema = t.Object({
  content: t.String(),
  authorId: t.String(),
});

export const CreateMessageResponseSchema = t.Object({
  status: t.Literal("success"),
  data: t.Object({
    message: t.Object({
      id: t.String(),
      content: t.String(),
      authorId: t.String(),
      channelId: t.String(),
      createdAt: t.Union([t.Date(), t.Null()]),
      updatedAt: t.Union([t.Date(), t.Null()]),
      edited: t.Union([t.Boolean(), t.Null()]),
    }),
  }),
});

export const CreateMessageErrorSchema = t.Object({
  status: t.Literal("error"),
  message: t.String(),
});

export type CreateMessageRequest = Static<typeof CreateMessageRequestSchema>;
export type CreateMessageResponse = Static<typeof CreateMessageResponseSchema>;
export type CreateMessageError = Static<typeof CreateMessageErrorSchema>;

export const createMessage = async (roomId: string, message: CreateMessageRequest) => {
  try {
    const newMessage = await MessageRepository.create(roomId, message);
    return {
      status: "success",
      data: {
        message: {
          id: newMessage.id,
          content: newMessage.content,
          authorId: newMessage.authorId,
          channelId: newMessage.channelId,
          createdAt: newMessage.createdAt,
          updatedAt: newMessage.updatedAt,
          edited: newMessage.edited,
        },
      },
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Failed to create message",
    };
  }
};

export const GetMessagesRequestSchema = t.Object({
  limit: t.Optional(t.Number()),
  cursor: t.Optional(t.String()),
});

export const GetMessagesResponseSchema = t.Object({
  status: t.Literal("success"),
  data: t.Object({
    messages: t.Array(t.Object({
      id: t.String(),
      content: t.String(),
      authorId: t.String(),
      channelId: t.String(),
      createdAt: t.Union([t.Date(), t.Null()]),
      updatedAt: t.Union([t.Date(), t.Null()]),
      edited: t.Union([t.Boolean(), t.Null()]),
    })),
    cursor: t.Optional(t.String()),
  }),
});

export const GetMessagesErrorSchema = t.Object({
  status: t.Literal("error"),
  message: t.String(),
});

export type GetMessagesRequest = Static<typeof GetMessagesRequestSchema>;
export type GetMessagesResponse = Static<typeof GetMessagesResponseSchema>;
export type GetMessagesError = Static<typeof GetMessagesErrorSchema>;

export const getMessages = async (roomId: string, params: GetMessagesRequest) => {

  try {
    const messages = await MessageRepository.getMessages(roomId, params);
    return {
      status: "success",
      data: {
        messages,
        cursor: messages.length > 0 ? messages[messages.length - 1].id : undefined,
      },
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Failed to get messages",
    };
  }
};
