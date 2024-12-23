import { z } from "zod";
import { publicProcedure, router } from "./tRPC";
import prisma from "@/prisma";

export const userRouter = router({
    getUser: publicProcedure
        .input(
            z.object({
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
                    message: "User not found", status: 404
                }
            }

            return {
                message: "User found",
                user: user,
                status: 200,
            }
        })
})

export default userRouter