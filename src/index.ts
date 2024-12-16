import { serve } from "@hono/node-server";

import app from "./app";
import env from "./env";
import { trpcServer } from "@hono/trpc-server";
import { appRouter } from "./routes/_app";
import { cors } from "hono/cors";

const port = env.PORT;
console.log(`Server is running on port http://localhost:${port}`);

const ORIGIN = env.NODE_ENV === "development" ? "http://localhost:5173/" : env.NODE_ENV === "production" ? "https://kaohut.pages.dev/" : ""

app.use(
  "/*",
  cors(),
);

app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
  })
);

// Should remove this later on
app.get("/", async (c) => {
  return c.text(ORIGIN);
});

serve({
  fetch: app.fetch,
  port,
  hostname: env.NODE_ENV === "development" ? "127.0.0.1" : undefined,
});
