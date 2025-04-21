import { ElysiaWS } from "elysia/dist/ws";

export interface TokenPayload {
  userId: string;
  deviceId?: string;
  iss?: string;
  iat?: number;
  exp?: number;
  [key: string]: unknown;
}

export enum PermissionFlags {
  SendMessages = 1 << 0,
  ViewChannels = 1 << 1,
  ManageMessages = 1 << 2,
  ManageChannels = 1 << 3,
  ManageRoles = 1 << 4,
  KickMembers = 1 << 5,
  BanMembers = 1 << 6,
  ManageGuild = 1 << 7,
}
type WS = ElysiaWS<{
  query: Record<string, string | undefined>;
  params: {};
  headers: Record<string, string | undefined>;
  cookie: Record<string, Cookie<string | undefined>>;
  body: WsBody;
}> & {
  body: WsBody;
};

interface WsBody {
  type: string;
  room: string;
  content: string;
  domain: string;
  user?: string;
}
