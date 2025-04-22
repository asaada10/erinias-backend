// index.ts
import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { AppRoutes } from "./app.routes";

new Elysia().use(swagger()).use(AppRoutes).listen(8888);
console.log("🚀 Elysia app running at https://localhost:8888");
