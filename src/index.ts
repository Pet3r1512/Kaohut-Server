import { serve } from "@hono/node-server";

import app from "./app";
import env from "./env";
import { auth } from "./utils/auth";
import { trpcServer } from "@hono/trpc-server";
import { appRouter } from "./routes/_app";

const port = env.PORT;
console.log(`Server is running on port http://localhost:${port}`);

app.use("/*", cors());
app.use(
  "/*",
  cors({
    // origin: "https://kaohut.pages.dev/",
    origin: "http://localhost:5173/",
    allowHeaders: ["X-Custom-Header", "Upgrade-Insecure-Requests"],
    allowMethods: ["POST", "GET", "OPTIONS"],
    exposeHeaders: ["Content-Length", "X-Kuma-Revision"],
    maxAge: 600,
    credentials: true,
  }),
);
app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
  })
);

// Should remove this later on
app.get("/", async (c) => {
  return c.text("Hello Hono");
});

serve({
  fetch: app.fetch,
  port,
  hostname: env.NODE_ENV === "development" ? "127.0.0.1" : undefined,
});
