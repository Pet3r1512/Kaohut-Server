import { serve } from "@hono/node-server";

import app from "./app";
import env from "./env";
import { auth } from "./utils/auth";
import authRouter from "./routes/auth";

const port = env.PORT;
// eslint-disable-next-line no-console
console.log(`Server is running on port http://localhost:${port}`);

app.route("/api/auth", authRouter);

app.post('/api/auth/*', (c) => auth.handler(c.req.raw));

// Should remove this later on
app.get("/", async (c) => {
  return c.text("Hello Hono");
});

serve({
  fetch: app.fetch,
  port,
});
