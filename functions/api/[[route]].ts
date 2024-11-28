import { Hono } from "hono";

import authRouter from "../../src/routes/auth";
import { auth } from "../../src/utils/auth";

const app = new Hono();

app.route("/api/auth", authRouter);

app.post("/api/auth/*", (c) => auth.handler(c.req.raw));

// Should remove this later on
app.get("/", async (c) => {
    return c.text("Hello Hono");
});

export default app;
