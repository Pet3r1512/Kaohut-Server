import { auth } from "@/utils/auth";
import { publicProcedure, router } from "./tRPC";
import { z } from "zod";

export const authRouter = router({
    signUp: publicProcedure
        .input(z.object({
            email: z.string().email('Invalid email'),
            password: z.string().min(8, 'Password must be at least 8 characters'),
            name: z.string(),
            role: z.string(),
            workplace: z.string()
        }))
        .mutation(
            async ({ input }) => {
                const { email, password, name, role, workplace } = input
                const response = await auth.api.signUpEmail({
                    body: { email, password, name, role, workplace }
                })
                if (!response) {
                    return { status: 400, message: "Error" }
                }
                return { status: 201, message: "Sign Up Done" }
            }
        ),
    signIn: publicProcedure
        .input(z.object({
            email: z.string().email('Ivalid Email'),
            password: z.string()
        }))
        .mutation(
            async ({ input }) => {
                const { email, password } = input
                const response = await auth.api.signInEmail({
                    body: { email, password }
                })

                if (!response) {
                    return { message: "Error", status: 400 }
                }
                return { message: "Sign In Done", status: 200 }
            }
        )

})

export default authRouter;