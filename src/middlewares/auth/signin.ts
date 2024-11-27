import { createMiddleware } from "hono/factory";

export type SignInDataType = {
    email: string,
    password: string,
}

export const signInValidator = createMiddleware<{
    Variables: {
        signInData: SignInDataType
    }
}>(async (c, next) => {
    const body = await c.req.json()
    const { email, password } = body

    if (!body || typeof email !== "string" || typeof password !== "string") {
        return c.json({ message: "Invalid signup credentials" }, 400);
    }

    const emailRegex = /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i;

    if (!emailRegex.test(email)) {
        return c.json({ message: "Invalid email" }, 400)
    }

    if (password.length < 8) {
        return c.json({ message: "Password must be at least 8 characters" }, 400)
    }

    c.set('signInData', body)

    await next()
})