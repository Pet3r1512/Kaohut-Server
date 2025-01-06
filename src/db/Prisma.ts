import { PrismaClient } from "@prisma/client";

let prisma: PrismaClient;

if (typeof global != "undefined") {
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
