import { PrismaClient, Role, TaskStatus, TaskPriority, MistakeSeverity } from '@prisma/client';

let prisma: PrismaClient | null = null;

export function getPrisma(): PrismaClient {
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    throw new Error("DATABASE_URL is missing from environment variables.");
  }

  // Prevent multiple instances of Prisma Client in development
  if (process.env.NODE_ENV === "development") {
    const globalForPrisma = global as unknown as { prisma: PrismaClient };
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = new PrismaClient({
        datasources: { db: { url: dbUrl } },
      });
    }
    return globalForPrisma.prisma;
  }

  // In production, always return a new instance or manage via connection pooling
  if (!prisma) {
    prisma = new PrismaClient({
      datasources: { db: { url: dbUrl } },
    });
  }
  
  return prisma;
}
