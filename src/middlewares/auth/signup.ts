import { middleware } from '@/routes/tRPC';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

// Define the input schema using zod
const signUpSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string(),
  role: z.string()
});

// Define the middleware
export const signUpValidator = middleware(async ({ ctx, next, input }) => {
  try {
    // Validate the input using the schema
    const signUpData = signUpSchema.parse(input);

    return next({
      ctx: {
        ...ctx,
        signUpData,
      },
    });
  } catch (error) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: error instanceof z.ZodError ? error.errors[0].message : 'Invalid input',
    });
  }
});
