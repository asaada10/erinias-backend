import { SignJWT, jwtVerify } from "jose";
import { Auth } from "./auth"; // Ajusta según tu implementación de ORM
import type { TokenPayload } from "../utils/types";
import { InternalServerError } from "../errors";
class Token {
  // Claves y configuraciones
  private static readonly JWT_SECRET: string = Bun.env.JWT_SECRET!;
  private static readonly REFRESH_SECRET: string = Bun.env.REFRESH_SECRET!;
  private static readonly ISSUER: string = "erinias"; // Ajusta según tu dominio o app
  static readonly ACCESS_EXPIRY: string = "15m"; // 15 minutos
  static readonly REFRESH_EXPIRY: string = "30d"; // 30 días

  // Genera ambos tokens y almacena el refresh token en la base de datos
  static async generate(
    userId: string,
    headers: Record<string, string | undefined>
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const deviceId = this.generateDeviceId(headers);

    // Generar Access Token
    const accessToken = await new SignJWT({ userId })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setIssuedAt()
      .setIssuer(this.ISSUER)
      .setExpirationTime(Token.ACCESS_EXPIRY)
      .sign(new TextEncoder().encode(this.JWT_SECRET));

    // Generar Refresh Token (que incluirá el deviceId)
    const refreshToken = await new SignJWT({ userId, deviceId })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setIssuedAt()
      .setIssuer(this.ISSUER)
      .setExpirationTime(Token.REFRESH_EXPIRY)
      .sign(new TextEncoder().encode(this.REFRESH_SECRET));

    try {
      await Auth.saveRefreshToken({
        userId,
        token: refreshToken,
        deviceId,
        expiresAt: new Date(
          Date.now() + this.getExpiryInMs(Token.REFRESH_EXPIRY)
        ),
      });
    } catch (error) {
      console.error("Error al guardar el refresh token:", error);
      throw new InternalServerError();
    }

    return { accessToken, refreshToken };
  }

  // Valida un access token JWT
  static async validate(
    token: string,
    type: "access" | "refresh"
  ): Promise<TokenPayload | null> {
    try {
      const { payload } = await jwtVerify(
        token,
        new TextEncoder().encode(
          type === "access" ? this.JWT_SECRET : this.REFRESH_SECRET
        )
      );
      return payload as TokenPayload;
    } catch (error) {
      console.error(type + " token inválido.");
      return null;
    }
  }

  // Renueva el access token usando el refresh token (rotación incluida)
  static async renewTokens(
    refreshToken: string,
    headers: Record<string, string | undefined>
  ): Promise<{ accessToken: string; refreshToken: string } | null> {
    try {
      const { payload } = (await jwtVerify(
        refreshToken,
        new TextEncoder().encode(this.REFRESH_SECRET)
      )) as { payload: TokenPayload };

      // Verificar si el refresh token está almacenado y no revocado
      const storedToken = await Auth.findRefreshToken(refreshToken);
      if (!storedToken || storedToken.revoked) return null;

      // Verificar dispositivo
      const currentDeviceId = this.generateDeviceId(headers);
      if (payload.deviceId !== currentDeviceId) {
        await Auth.revokeRefreshToken(refreshToken);
        return null;
      }

      // Revocar el refresh token antiguo para prevenir reuso
      await Auth.revokeRefreshToken(refreshToken);

      // Generar nuevo Access Token
      const newAccessToken = await new SignJWT({ userId: payload.userId })
        .setProtectedHeader({ alg: "HS256", typ: "JWT" })
        .setIssuedAt()
        .setIssuer(this.ISSUER)
        .setExpirationTime(Token.ACCESS_EXPIRY)
        .sign(new TextEncoder().encode(this.JWT_SECRET));

      // Generar nuevo Refresh Token
      const newRefreshToken = await new SignJWT({
        userId: payload.userId,
        deviceId: currentDeviceId,
      })
        .setProtectedHeader({ alg: "HS256", typ: "JWT" })
        .setIssuedAt()
        .setIssuer(this.ISSUER)
        .setExpirationTime(Token.REFRESH_EXPIRY)
        .sign(new TextEncoder().encode(this.REFRESH_SECRET));

      await Auth.saveRefreshToken({
        userId: payload.userId,
        token: newRefreshToken,
        deviceId: currentDeviceId,
        expiresAt: new Date(
          Date.now() + this.getExpiryInMs(Token.REFRESH_EXPIRY)
        ),
      });

      return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    } catch (error) {
      console.error("Error en la renovación de tokens:", error);
      return null;
    }
  }

  // Helper para convertir un string de expiración a milisegundos (soporta minutos, horas y días)
  static getExpiryInMs(expiry: string): number {
    const unit = expiry.slice(-1);
    const amount = parseInt(expiry.slice(0, -1));
    switch (unit) {
      case "m":
        return amount * 60 * 1000;
      case "h":
        return amount * 60 * 60 * 1000;
      case "d":
        return amount * 24 * 60 * 60 * 1000;
      default:
        throw new Error("Formato de expiración inválido");
    }
  }

  // Genera un ID único de dispositivo basado en la solicitud (sin incluir IP)
  private static generateDeviceId(
    headers: Record<string, string | undefined>
  ): string {
    const fingerprint = [
      headers["user-agent"] || "",
      headers["accept-language"] || "",
      headers["sec-ch-ua-platform"] || "",
    ].join("|");
    return Bun.hash(fingerprint).toString();
  }

  // Revoca un refresh token
  static async revoke(refreshToken: string): Promise<boolean> {
    try {
      await Auth.revokeRefreshToken(refreshToken);
      return true;
    } catch (error) {
      console.error("Error al revocar refresh token:", error);
      return false;
    }
  }

  // (Opcional) Si necesitas validar dispositivos asociados al usuario
  static async isDeviceValid(
    userId: string,
    deviceId: string
  ): Promise<boolean> {
    const devices = await Auth.getUserDevices(userId);
    return devices.some((device) => device.deviceId === deviceId);
  }

  // Renueva solo el access token si el refresh token es válido
  static async renewAccessToken(
    refreshToken: string,
    headers: Record<string, string | undefined>
  ): Promise<string | null> {
    try {
      const { payload } = (await jwtVerify(
        refreshToken,
        new TextEncoder().encode(this.REFRESH_SECRET)
      )) as { payload: TokenPayload };

      // Verificar si el refresh token sigue válido en la base de datos
      const storedToken = await Auth.findRefreshToken(refreshToken);
      if (!storedToken || storedToken.revoked) return null;

      // Verificar que el dispositivo coincida
      const currentDeviceId = this.generateDeviceId(headers);
      if (payload.deviceId !== currentDeviceId) {
        await Auth.revokeRefreshToken(refreshToken);
        return null;
      }

      // Generar nuevo access token sin rotar el refresh token
      const newAccessToken = await new SignJWT({ userId: payload.userId })
        .setProtectedHeader({ alg: "HS256", typ: "JWT" })
        .setIssuedAt()
        .setIssuer(this.ISSUER)
        .setExpirationTime(Token.ACCESS_EXPIRY)
        .sign(new TextEncoder().encode(this.JWT_SECRET));

      return newAccessToken;
    } catch (error) {
      console.error("Error al renovar el access token:", error);
      return null;
    }
  }
}

export default Token;
