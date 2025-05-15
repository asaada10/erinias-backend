import { WS } from "../../shared/infrastructure/utils/types";
import {
  createMessage,
  CreateMessageRequest,
} from "../../message/application/message.usecase";
import { connectionManager } from "./connectionManager";

export async function joinRoom(ws: WS, room: string) {
  if (!ws.isSubscribed(room)) {
    ws.subscribe(room);
    // Eliminar la suscripción de todos los sockets del usuario para evitar duplicados
    // connectionManager.get(ws.body.user!)?.forEach((s) => {
    //   if (s !== ws) {
    //     s.subscribe(room);
    //   }
    // });
    console.log(`El usuario ${ws.body.user} se ha unido a la sala ${room}`);
  }
}

// Función para enviar un mensaje a todos los miembros de una sala
export async function sendMessage(
  ws: WS,
  room: string,
  content: string,
  domain: string
) {
  if (!ws.isSubscribed(room)) {
    console.log(`La sala ${room} no existe o no tiene suscriptores`);
    return;
  }

  try {
    // Crear el mensaje en la base de datos
    const messageRequest: CreateMessageRequest = {
      content,
      authorId: ws.body.user!,
    };
    const result = await createMessage(room, messageRequest);

    if (result.status === "success") {
      // Publicar el mensaje a todos los suscriptores
      ws.publish(room, {
        type: "message",
        content: content,
        domain: domain,
        authorId: ws.body.user,
        room: room,
      });
    } else {
      console.error("Error al crear el mensaje:", result.message);
    }
  } catch (error) {
    console.error("Error al procesar el mensaje:", error);
  }
}
