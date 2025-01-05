import { z } from "zod";
import { publicProcedure, router } from "./tRPC";
import prisma from "@/prisma";

export const userRouter = router({
    getUser: publicProcedure
        .input(z.object({
            email: z.string()
        }))
        .mutation(async ({ input }) => {
            const { email } = input
            const user = await prisma.user.findUnique({
                where: {
                    email: email
                }
            })

            if (!user) {
                return {
                    message: "Error",
                    status: 400
                }
            }

            return {
                message: "User found",
                status: 200,
                user: user
            }
        })
})

export default userRouter