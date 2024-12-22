import { serve } from "@hono/node-server";

import app from "./app";
import env from "./env";
import { cors } from "hono/cors";
import { auth, CLIENT_URL } from "./utils/auth";

const port = env.PORT;
console.log(`Server is running on port http://localhost:${port}`);
interface Game {
  hostname: string;
  players: { id: string; name: string; score: number }[];
}

const games: Record<string, Game> = {};

app.use(
  "/api/auth/**",
  cors({
    origin: CLIENT_URL,
    allowHeaders: ["Content-Type", "Authorization"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true,
  })
);

app.on(["POST", "GET"], "/api/auth/**", (c) => auth.handler(c.req.raw));

serve({
  fetch: app.fetch,
  port,
  hostname: env.NODE_ENV === "development" ? "127.0.0.1" : undefined,
});
