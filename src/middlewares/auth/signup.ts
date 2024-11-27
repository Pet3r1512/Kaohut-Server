import { createMiddleware } from 'hono/factory'

export type SignUpDataType = {
  email: string,
  password: string,
  name: string,
  role: string
}

export const signUpValidator = createMiddleware<{
  Variables: {
    signUpData: SignUpDataType
  }
}>(async (c, next) => {
  const body = await c.req.json();
  const { email, password, name, role } = body;

  if (!body || typeof email !== "string" || typeof password !== "string" || typeof name !== "string") {
    return c.json({ message: "Invalid signup credentials" }, 400);
  }

  const emailRegex = /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i;

  if (!emailRegex.test(email)) {
    return c.json({ messgae: "Invalid email" }, 400);
  }

  if (password.length < 8) {
    return c.json({ message: "Password must be at least 8 characters" }, 400);
  }

  if (role !== "teacher" && role !== "student") {
    return c.json({ message: "Invalid role" }, 400);
  }

  c.set('signUpData', body)

  await next();
})
