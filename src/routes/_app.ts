import authRouter from './auth';
import quizRouter from './quiz';
import { router } from './tRPC';

export const appRouter = router({
    auth: authRouter,
    quiz: quizRouter
});

export type AppRouter = typeof appRouter;