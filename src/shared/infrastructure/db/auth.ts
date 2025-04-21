import { eq } from "drizzle-orm";
import { db } from ".";
import * as table from "./schema";

export class Auth {
  /**
   * Guarda un refresh token en la base de datos.
   */
  static async saveRefreshToken({
    userId,
    token,
    deviceId,
    expiresAt,
  }: {
    userId: string;
    token: string;
    deviceId: string;
    expiresAt: Date;
  }): Promise<void> {
    await db.insert(table.refreshTokens).values({
      userId,
      token,
      deviceId,
      expiresAt,
      revoked: false,
    });
  }

  /**
   * Busca un refresh token en la base de datos.
   */
  static async findRefreshToken(token: string): Promise<{
    id: number;
    userId: string;
    token: string;
    deviceId: string;
    revoked: boolean;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
  } | null> {
    const result = await db
      .select()
      .from(table.refreshTokens)
      .where(eq(table.refreshTokens.token, token));
    return result[0] || null;
  }

  /**
   * Revoca (marca como revocado) un refresh token.
   */
  static async revokeRefreshToken(token: string): Promise<void> {
    await db
      .update(table.refreshTokens)
      .set({ revoked: true })
      .where(eq(table.refreshTokens.token, token));
  }

  /**
   * Obtiene los dispositivos (deviceId) asociados a un usuario.
   * Se consideran todos los refresh tokens (activos o revocados) para armar la lista de dispositivos.
   */
  static async getUserDevices(userId: string): Promise<{ deviceId: string }[]> {
    const results = await db
      .select({ deviceId: table.refreshTokens.deviceId })
      .from(table.refreshTokens)
      .where(eq(table.refreshTokens.userId, userId));

    // Se eliminan duplicados en caso de que existan varios tokens para el mismo dispositivo
    const uniqueDevices = Array.from(
      new Set(results.map((r) => r.deviceId))
    ).map((deviceId) => ({
      deviceId,
    }));

    return uniqueDevices;
  }
}
