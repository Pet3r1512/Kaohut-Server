import { serve } from "@hono/node-server";

import app from "./app";
import prisma from "./db/Prisma";
import env from "./env";

const port = env.PORT;
// eslint-disable-next-line no-console
console.log(`Server is running on port http://localhost:${port}`);

app.get("/", async (c) => {
  const newUser = await prisma.user.create({
    data: {
      email: "email@gmail.com",
      password: "15122002",
      fullName: "Thanh Phong",
      role: "student",
    },
  });
  return c.json(newUser);
});

serve({
  fetch: app.fetch,
  port,
});
