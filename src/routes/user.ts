import { z } from "zod";
import { publicProcedure, router } from "./tRPC";
import prisma from "@/prisma";

export const userRouter = router({
    getUser: publicProcedure
        .input(z.object({
            userId: z.string()
        }))
        .mutation(async ({ input }) => {
            const { userId } = input
            const user = await prisma.user.findUnique({
                where: {
                    id: userId
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