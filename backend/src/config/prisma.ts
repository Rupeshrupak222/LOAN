import { PrismaClient } from '@prisma/client';
import { env } from './env';
import { logger } from './logger';

export const prisma = new PrismaClient({
  datasourceUrl: env.databaseUrl,
  log: env.isProduction ? ['error', 'warn'] : ['error', 'warn'],
});

// Auto-retry queries on transient Supabase PgBouncer pooler connection drops
prisma.$use(async (params, next) => {
  const maxRetries = 3;
  let lastError: any;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await next(params);
    } catch (err: any) {
      lastError = err;
      const isConnError =
        err?.code === 'P1001' ||
        err?.code === 'P2024' ||
        err?.code === 'P2028' ||
        err?.message?.includes("Can't reach database server") ||
        err?.message?.includes('closed') ||
        err?.message?.includes('connection') ||
        err?.message?.includes('EMAXCONNSESSION') ||
        err?.message?.includes('max clients reached');

      if (isConnError && attempt < maxRetries) {
        logger.warn(
          { attempt, maxRetries, model: params.model, action: params.action, err: err.message },
          'Prisma query auto-retrying on transient connection/pooler drop...'
        );
        await new Promise((r) => setTimeout(r, 400 * attempt));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
});

export async function connectDatabase(maxRetries = 2, delayMs = 1000): Promise<void> {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      await prisma.$connect();
      logger.info('Database connected successfully via Prisma');
      return;
    } catch (err: any) {
      attempt++;
      if (attempt >= maxRetries) {
        if (!env.isProduction) {
          logger.warn(
            { err: err.message },
            '⚠️ Database connection could not be established on startup. Server starting in development mode. Please ensure PostgreSQL is running or update DATABASE_URL in backend/.env.'
          );
          return;
        }
        throw err;
      }
      logger.warn({ attempt, maxRetries, err: err.message }, 'Database connection retry...');
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}
