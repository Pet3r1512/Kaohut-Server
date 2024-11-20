/* eslint-disable unicorn/filename-case */
import { PrismaClient } from "@prisma/client";

// eslint-disable-next-line import/no-mutable-exports
let prisma: PrismaClient;

// eslint-disable-next-line no-restricted-globals
if (typeof global != "undefined") {
  // eslint-disable-next-line no-restricted-globals
  const globalWithPrisma = global as typeof global & { prisma?: PrismaClient };

  if (!globalWithPrisma.prisma) {
    globalWithPrisma.prisma = new PrismaClient();
  }

  prisma = globalWithPrisma.prisma;
}
else {
  prisma = new PrismaClient();
}

export default prisma;
