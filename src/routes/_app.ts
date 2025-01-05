import authRouter from './auth';
import quizRouter from './quiz';
import userRouter from './user';
import { router } from './tRPC';

export const appRouter = router({
    auth: authRouter,
    quiz: quizRouter,
    user: userRouter
});

export type AppRouter = typeof appRouter;