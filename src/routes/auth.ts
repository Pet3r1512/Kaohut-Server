import { auth } from "@/utils/auth";
import { publicProcedure, router } from "./tRPC";
import { z } from "zod";
import prisma from "@/db/Prisma";

export const authRouter = router({
  signUp: publicProcedure
    .input(
      z.object({
        email: z.string().email("Invalid email"),
        password: z.string().min(8, "Password must be at least 8 characters"),
        name: z.string(),
        role: z.string(),
        workplace: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const { email, password, name, role, workplace } = input;
      const response = await auth.api.signUpEmail({
        body: { email, password, name, role, workplace },
      });
      if (!response) {
        return { status: 400, message: "Error" };
      }
      return { status: 201, message: "Sign Up Done" };
    }),
  signIn: publicProcedure
    .input(
      z.object({
        email: z.string().email("Ivalid Email"),
        password: z.string(),
        rememberMe: z.boolean().optional(),
        callbackURL: z.string().url().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const {
        email,
        password,
        rememberMe = true,
        callbackURL = "https://kaohut.pages.dev/dashboard/dashboard",
      } = input;
      const response = await auth.api.signInEmail({
        body: { email, password, rememberMe, callbackURL },
      });

      if (!response) {
        return { message: "Error", status: 400 };
      }

      return {
        message: "Sign In Done",
        status: 200,
        redirectTo: callbackURL || null,
      };
    }),
  getSession: publicProcedure
    .input(
      z.object({
        userId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const { userId } = input;
      const session = await prisma.session.findFirst({
        where: {
          userId: userId,
        },
      });

      if (!session) {
        return { message: "Error", status: 400 };
      }

      return {
        message: "Session existed",
        status: 200,
        session: session,
      };
    }),
  signOut: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input }) => {
      const { token } = input;
      await prisma.session.delete({
        where: {
          token: token,
        },
      });
      return {
        message: "Sign Out Done",
        status: 200,
      };
    }),
});

export default authRouter;
