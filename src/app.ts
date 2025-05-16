// index.ts
import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { AppRoutes } from "./app.routes";
import cors from "@elysiajs/cors";

new Elysia().use(
  cors({
    origin: 'https://chat.asaada10.dev',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id'],
    maxAge: 86400
  })
).options('*', () => '').use(swagger()).use(AppRoutes).listen(8888);
console.log("🚀 Elysia app running at https://localhost:8888");
