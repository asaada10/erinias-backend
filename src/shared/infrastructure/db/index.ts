import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
if (!Bun.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
const client = postgres(Bun.env.DATABASE_URL);
export const db = drizzle(client);
