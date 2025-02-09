import { z } from "zod";
import { publicProcedure, router } from "./tRPC";
import prisma from "@/prisma";

const quizRouter = router({
    createQuiz: publicProcedure
        .input(
            z.object({
                title: z.string(),
                description: z.string(),
                creatorId: z.string(),
                isPublic: z.boolean().optional().default(true),
                time: z.number().optional().default(20),
                mode: z.string().optional().default("single"),
                category: z.string().optional().default(""),
                questions: z.array(
                    z.object({
                        questionText: z.string(),
                        answers: z.array(
                            z.object({
                                answerText: z.string(),
                                isCorrect: z.boolean(),
                            })
                        ),
                    })
                ),
            })
        )
        .mutation(async ({ input }) => {
            const { title, description, creatorId, questions, isPublic, time, mode, category } = input;

            const user = await prisma.user.findUnique({
                where: { id: creatorId },
                select: { name: true },
            });

            if (!user) {
                throw new Error("Creator not found");
            }

            await prisma.quiz.create({
                data: {
                    title,
                    description,
                    creatorId: creatorId,
                    creatorName: user.name,
                    isPublic,
                    length: questions.length,
                    time,
                    mode,
                    category,
                    questions: {
                        create: questions.map((question) => ({
                            questionText: question.questionText,
                            answers: {
                                create: question.answers.map((answer) => ({
                                    answerText: answer.answerText,
                                    isCorrect: answer.isCorrect,
                                })),
                            },
                        })),
                    },
                },
            });
        }),

    getAllQuizzes: publicProcedure.query(async () => {
        const quizzes = await prisma.quiz.findMany()

        return {
            quizzes: quizzes
        }
    }),
    getFirst10Quizzes: publicProcedure.query(async () => {
        const quizzes = await prisma.quiz.findMany({
            take: 5,
            orderBy: {
                createdAt: 'desc',
            },
        });

        return {
            quizzes: quizzes,
        };
    }),
    getQuiz: publicProcedure.input(z.object({ quizId: z.string() })).mutation(async ({ input }) => {
        const { quizId } = input
        const quiz = await prisma.quiz.findUnique({
            where: {
                id: quizId
            }
        })

        return {
            quiz: quiz
        }
    }),
    getTotalQuestions: publicProcedure
        .input(z.object({ quizId: z.string() }))
        .mutation(async ({ input }) => {
            const { quizId } = input;

            const totalQuestions = await prisma.quiz.findUnique({
                where: { id: quizId },
                select: {
                    questions: {
                        select: { id: true },
                    },
                },
            });

            if (!totalQuestions) {
                throw new Error("Quiz not found");
            }

            return totalQuestions.questions.length;
        }),
});

export default quizRouter