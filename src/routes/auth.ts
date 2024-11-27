import { signInValidator } from "@/middlewares/auth/signin";
import { signUpValidator } from "@/middlewares/auth/signup";
import { auth } from "@/utils/auth";
import { Hono } from "hono";

const authRouter = new Hono()
authRouter.post("/signup", signUpValidator, async (c) => {
    const { email, password, name, role } = c.var.signUpData

    const response = await auth.api.signUpEmail({
        body: { email, password, name, role },
    });

    if (!response) {
        return c.json(
            { message: "Error" }, 400
        )
    }

    return c.json(
        { message: "Sign Up done" }, 201
    )
})

authRouter.post("/signin", signInValidator, async (c) => {
    const { email, password } = c.var.signInData
    const response = await auth.api.signInEmail({
        body: { email, password }
    })

    if (!response) {
        return c.json({ message: "Error" }, 400)
    }

    return c.json({
        message: "Sign In Done"
    }, 201)
})

export default authRouter;