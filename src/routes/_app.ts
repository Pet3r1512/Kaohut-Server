import authRouter from './auth';
import { router } from './tRPC';

export const appRouter = router({
    auth: authRouter,
});

export type AppRouter = typeof appRouter;