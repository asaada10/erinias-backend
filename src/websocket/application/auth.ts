import Token from "../../shared/infrastructure/db/token";
import { WS } from "../../shared/infrastructure/utils/types";

export async function authenticateUser(ws: WS) {
  const token = ws.data.cookie["access_token"];
  console.log(token, "TOKEN");
  if (!token) return ws.close(1008, "Failed to authenticate");
  const validate = await Token.validate(token, "access");
  if (!validate) return ws.close(1008, "Failed to authenticate");
  ws.body.user = validate.userId;
}
