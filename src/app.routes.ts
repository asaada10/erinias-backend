import Elysia from "elysia";

import { AuthController } from "./auth/infrastructure/auth.controller";
import { UserController } from "./user/infrastructure/user.controller";
import { WsController } from "./websocket/infrastructure/ws.controller";
import { RoomController } from "./room/infrastructure/room.controller";
import { MessageController } from "./message/infrastructure/message.controller";
import { authMiddleware } from "./shared/infrastructure/middlewares/auth.middleware";

const routes = new Elysia({ prefix: Bun.env.APP_VERSION })
  .use(authMiddleware)
  .use(AuthController)
  .use(RoomController)
  .use(MessageController)
  .use(UserController)
  .use(WsController);

export { routes as AppRoutes };
