import { PrismaClient, Role, TaskStatus, TaskPriority, MistakeSeverity } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

export function getPrisma(): PrismaClient {
  const isProduction = process.env.NODE_ENV === 'production';
  // Use the pooled connection (DATABASE_URL) for both dev and prod clients
  // DIRECT_URL should only be used by prisma CLI for migrations
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    throw new Error('Missing DATABASE_URL environment variable.');
  }

  if (!global.prisma) {
    global.prisma = new PrismaClient({
      datasources: { db: { url: dbUrl } },
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  }

  return global.prisma;
}

export function getTenantPrisma(organizationId: string) {
  const basePrisma = getPrisma();
  return basePrisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (model === 'Organization') {
            return query(args);
          }
          if (['findMany', 'findFirst', 'findUnique', 'update', 'updateMany', 'delete', 'deleteMany', 'count'].includes(operation)) {
             const anyArgs = (args || {}) as any;
             anyArgs.where = { ...(anyArgs.where || {}), organizationId };
             return query(anyArgs);
          }
          return query(args);
        },
      },
    },
  });
}
