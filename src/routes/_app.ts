import authRouter from './auth';
import { publicProcedure, router } from './tRPC';

export const appRouter = router({
    auth: authRouter
});

// Export only the type of a router!
// This prevents us from importing server code on the client.
export type AppRouter = typeof appRouter;