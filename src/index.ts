import { serve } from "@hono/node-server";

import app from "./app";
import env from "./env";
import { auth } from "./utils/auth";
import authRouter from "./routes/auth";
import { trpcServer } from "@hono/trpc-server";
import { appRouter } from "./routes/_app";

const port = env.PORT;
console.log(`Server is running on port http://localhost:${port}`);

app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
  })
);

// app.route("/api/auth", authRouter);

app.post('/api/auth/*', (c) => auth.handler(c.req.raw));

// Should remove this later on
app.get("/", async (c) => {
  return c.text("Hello Hono");
});

serve({
  fetch: app.fetch,
  port,
  hostname: env.NODE_ENV === "development" ? "127.0.0.1" : undefined,
});
