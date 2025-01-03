import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";
import env from "@/env";

const prisma = new PrismaClient();

export const CLIENT_URL =
  env.NODE_ENV === "development"
    ? "http://localhost:5173"
    : "https://kaohut.pages.dev";

export const SERVER_URL =
  env.NODE_ENV === "development"
    ? "http://localhost:9999"
    : "https://blonde-michell-pet3r-22028f0a.koyeb.app";

export const auth = betterAuth({
  baseURL: SERVER_URL,
  basePath: "/api/auth",
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
      },
      workplace: {
        type: "string",
        required: true,
      }
    },
  },
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  trustedOrigins: [CLIENT_URL],
});