import Elysia, { t } from "elysia";
import { joinRoom, sendMessage } from "../application/rooms";
import { WS } from "../../shared/infrastructure/utils/types";
import Token from "../../shared/infrastructure/db/token";
import { getAllRooms } from "../../room/application/all.usecase";
import { connectionManager } from "../application/connectionManager";

const roomSubscriptions: Record<string, Set<WS>> = {};

export const WsController = new Elysia().group("/ws", (app) =>
  app.ws("/", {
    body: t.Object({
      type: t.String(),
      room: t.String(),
      content: t.String(),
      domain: t.String(),
    }),
   async open(ws: WS) {
    try {
      const query = ws.data.query;
      if (!query) {
        console.log("No se proporcionó el token de acceso");
        return;
      }
      const payload = await Token.validate(query.otk!, "access");
      if (!payload) {
        console.log("Token de acceso inválido");
        return;
      }
      (ws.data as any).user = payload.userId;
      const res = await getAllRooms(payload.userId);
      for (const room of res.data.rooms) {
      ws.subscribe(room.id);
      }
      connectionManager.add(payload.userId, ws);
    } catch (error) {
      console.log("Error al abrir la conexión WebSocket:", error);
    }
  },

    async message(ws: WS, data) {
      ws.body.user = (ws.data as any).user;
      try {

        await joinRoom(ws, data.room);

  
        if (data.type === "message") {
          console.log("Mensaje recibido:", data);
          await sendMessage(ws, data.room, data.content, data.domain);
        }
      } catch (error) {
        console.log("Error al procesar el mensaje:", error);
        ws.send(
          JSON.stringify({
            status: "error",
            message: "Error al procesar el mensaje",
          })
        );
      }
    },

    close(ws) {
      try {
        console.log("Usuario desconectado");
        // Eliminar al usuario de todas las salas a las que está suscrito
        Object.keys(roomSubscriptions).forEach((roomId) => {
          roomSubscriptions[roomId].delete(ws);
        });
        connectionManager.remove((ws.body as any)?.user ?? "", ws);
      } catch (error) {
        console.error("Error al cerrar la conexión WebSocket:", error);
      }
    },
  })
);
