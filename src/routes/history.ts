import { z } from "zod";
import { publicProcedure, router } from "./tRPC";
import prisma from "@/db/Prisma";

const historyRouter = router({
    createHistory: publicProcedure
        .input(
            z.object({
                userId: z.string(),
                quizId: z.string(),
                quizName: z.string(),
                score: z.number(),
            })
        )
        .mutation(async ({ input }) => {
            const { userId, quizId, quizName, score } = input

            const newHistory = await prisma.history.create({
                data: {
                    userId,
                    quizId,
                    quizName,
                    score,
                }
            })

            if (!newHistory) {
                throw new Error("Cannot add record")
            }

            return {
                status: 201,
                message: "New history added",
                history: newHistory
            }
        }),
    getHistory: publicProcedure.input(z.object({
        userId: z.string()
    }))
        .mutation(async ({ input }) => {
            const { userId } = input

            const histories = await prisma.history.findMany({
                where: {
                    userId: userId
                take: 10,
                }
            })

            if (!histories) {
                throw new Error("Cannot get history")
            }

            return {
                status: 200,
                message: "All histories found",
                histories: histories
            }
        })
})

export default historyRouter