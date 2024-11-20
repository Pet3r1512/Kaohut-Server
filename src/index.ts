import { serve } from "@hono/node-server";

import app from "./app";
import prisma from "./db/Prisma";
import env from "./env";

const port = env.PORT;
// eslint-disable-next-line no-console
console.log(`Server is running on port http://localhost:${port}`);

app.get("/", async (c) => {
  return c.text("Hello Hono");
});

serve({
  fetch: app.fetch,
  port,
});
