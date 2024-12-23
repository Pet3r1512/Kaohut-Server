import authRouter from './auth';
import { publicProcedure, router } from './tRPC';
import { router } from './tRPC';
import userRouter from './user';

export const appRouter = router({
    auth: authRouter,
    user: userRouter
});

// Export only the type of a router!
// This prevents us from importing server code on the client.
export type AppRouter = typeof appRouter;