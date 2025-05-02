import Elysia, { t } from "elysia";
import { authenticateUser } from "../application/auth";
import { joinRoom, sendMessage } from "../application/rooms";
import { WS } from "../../shared/infrastructure/utils/types";

// Mapa para gestionar las suscripciones de los WebSockets a las salas
const roomSubscriptions: Record<string, Set<WS>> = {};

export const WsController = new Elysia().group("/ws", (app) =>
  app.ws("/", {
    body: t.Object({
      type: t.String(),
      room: t.String(),
      content: t.String(),
      domain: t.String(),
    }),
    beforeHandle(ws) {
      console.log(ws.headers.cookie)
      // const userId = ws.headers["x-user-id"];
      // if (!userId) {
      //   console.log("Conexión rechazada: falta el encabezado x-user-id");
      //   // ws.close(4001, "Falta el encabezado x-user-id");
      //   return false; // Cancel the WebSocket upgrade
      // }
      // console.log(`Conexión aceptada para el usuario: ${userId}`);
      return true; // Allow the WebSocket upgrade
    },
    open(ws) {
      console.log("Usuario conectado");
      console.log("x-user-id:", ws.data.headers["x-user-id"]);
    },

    async message(ws: WS, data) {
      try {
        // await authenticateUser(ws);

        await joinRoom(ws, data.room);

        if (data.type === "join") {
          await joinRoom(ws, data.room);
        }

        if (data.type === "message") {
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
      console.log("Usuario desconectado");
      // Eliminar al usuario de todas las salas a las que está suscrito
      Object.keys(roomSubscriptions).forEach((roomId) => {
        roomSubscriptions[roomId].delete(ws);
      });
    },
  })
);
