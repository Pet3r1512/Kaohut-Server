import prisma from "@/db/Prisma";
import getUser from "@/db/users/getUser";
import { signUpValidator } from "@/middlewares/signUpValidator";
import { Hono } from "hono";

const authRouter = new Hono()
authRouter.post("/signup", signUpValidator, async (c) => {
    const {email, password, name, role } = c.var.signUpData

    }

    prisma.$connect()
    await prisma.user.create({
        data: {
            email: email,
            password: password,
            fullName: fullName,
            role: "student"
        }
    })
    prisma.$disconnect()
    
    return c.json(
        {message: "Sign Up done"}, 201
    )
})

export default authRouter;