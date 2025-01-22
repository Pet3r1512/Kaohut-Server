import authRouter from './auth';
import quizRouter from './quiz';
import userRouter from './user';
import { router } from './tRPC';
import historyRouter from './history';

export const appRouter = router({
    auth: authRouter,
    quiz: quizRouter,
    user: userRouter,
    history: historyRouter
});

export type AppRouter = typeof appRouter;