import { serve } from "@hono/node-server";

import app from "./app";
import env from "./env";
import { trpcServer } from "@hono/trpc-server";
import { appRouter } from "./routes/_app";
import { cors } from "hono/cors";
import { auth } from "./utils/auth";

const port = env.PORT;
console.log(`Server is running on port http://localhost:${port}`);

app.use(
  "/api/auth/**", // or replace with "*" to enable cors for all routes
  cors({
    origin: "http://localhost:5173", // replace with your origin
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["POST", "GET", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true,
  })
);

app.on(["POST", "GET"], "/api/auth/**", (c) => auth.handler(c.req.raw));

// app.use(
//   "/trpc/*",
//   trpcServer({
//     router: appRouter,
//   })
// );

serve({
  fetch: app.fetch,
  port,
  hostname: env.NODE_ENV === "development" ? "127.0.0.1" : undefined,
});
