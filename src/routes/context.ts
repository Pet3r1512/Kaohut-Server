import prisma from "@/prisma";
import { auth } from "@/utils/auth";

export const createContext = () => {
    return {
        prisma,
        auth
    };
};

// Inferring the type of the context
export type Context = typeof createContext