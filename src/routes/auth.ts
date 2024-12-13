import { auth } from "@/utils/auth";
import { publicProcedure, router } from "./tRPC";
import { z } from "zod"
import { signUpValidator } from "@/middlewares/auth/signup";

export const authRouter = router({
    signUp: publicProcedure
        .input(z.object({
            email: z.string(),
            password: z.string(),
            name: z.string(),
            role: z.string()
        }))
        .use(signUpValidator)
        .mutation(
            async ({ input }) => {
                const { email, password, name, role } = input
                const response = await auth.api.signUpEmail({
                    body: { email, password, name, role }
                })
                if (!response) {
                    return { status: 400, message: "Error" }
                }
                return { status: 201, message: "Sign Up Done" }
            }
        ),
    test: publicProcedure.query(() => {
        return { messgae: "Test" }
    })

})

// const authRouter = new Hono()
// authRouter.post("/signup", signUpValidator, async (c) => {
//     const { email, password, name, role } = c.var.signUpData

//     const response = await auth.api.signUpEmail({
//         body: { email, password, name, role },
//     });

//     if (!response) {
//         return c.json(
//             { message: "Error" }, 400
//         )
//     }

//     return c.json(
//         { message: "Sign Up done" }, 201
//     )
// })

// authRouter.post("/signin", signInValidator, async (c) => {
//     const { email, password } = c.var.signInData
//     const response = await auth.api.signInEmail({
//         body: { email, password }
//     })

//     if (!response) {
//         return c.json({ message: "Error" }, 400)
//     }

//     return c.json({
//         message: "Sign In Done"
//     }, 201)
// })

export default authRouter;