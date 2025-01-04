import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";
import { jwt } from "better-auth/plugins"
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
  advanced: {
    crossSubDomainCookies: {
      enabled: true,
      domain: "https://kaohut.pages.dev"
    }
  },
  trustedOrigins: [CLIENT_URL],
  plugins: [
    jwt()
  ]
});