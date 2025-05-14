import { WS } from "../../shared/infrastructure/utils/types"

const userSockets = new Map<string, Set<WS>>()

export const connectionManager = {
  add(userId: string, socket: WS) {
    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set())
    }
    userSockets.get(userId)!.add(socket)
  },

  remove(userId: string, socket: WS) {
    if(!userId) return;
    const set = userSockets.get(userId)
    if (!set) return
    set.delete(socket)
    if (set.size === 0) {
      userSockets.delete(userId)
    }
  },

  get(userId: string): Set<WS> | undefined {
    return userSockets.get(userId)
  },

  broadcastTo(userId: string, message: any) {
    const sockets = userSockets.get(userId)
    if (!sockets) return
    const payload = JSON.stringify(message)
    for (const socket of sockets) {
      socket.send(payload)
    }
  }
}
