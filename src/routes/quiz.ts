import { z } from "zod";
import { publicProcedure, router } from "./tRPC";
import prisma from "@/prisma";

const quizRouter = router({
    createQuiz: publicProcedure
        .input(
            z.object({
                title: z.string(),
                description: z.string(),
                creator: z.string(),
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
            const { title, description, creator, questions } = input;

            await prisma.quiz.create({
                data: {
                    title,
                    description,
                    creator: {
                        connect: { id: creator },
                    },
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
    })
});

export default quizRouter