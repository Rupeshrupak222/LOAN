import { createApp } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { connectDatabase, disconnectDatabase } from './config/prisma';
import { enforceProductionEnvironmentValidation } from './config/env-validator';

async function bootstrap() {
  // 1. Fail-fast environment and secret validation
  enforceProductionEnvironmentValidation();

  // 2. Database connection
  await connectDatabase();

  // 3. App creation
  const app = createApp();

  const server = app.listen(env.port, () => {
    logger.info(`[STARTUP] Adyapan LMS API running on port ${env.port} (${env.nodeEnv})`);
    logger.info(`[STARTUP] API Prefix: ${env.apiPrefix}`);
    if (!env.isProduction) {
      logger.info(`[STARTUP] API docs at http://localhost:${env.port}/api/docs`);
    }
  });

  // 4. Graceful shutdown handler with bounded 10s drain timeout
  let isShuttingDown = false;
  const shutdown = async (signal: string) => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    logger.info(`[SHUTDOWN] ${signal} received, draining active connections...`);

    const forceTimer = setTimeout(() => {
      logger.error('[SHUTDOWN] Force terminating process after 10s timeout');
      process.exit(1);
    }, 10_000);

    if (typeof forceTimer.unref === 'function') {
      forceTimer.unref();
    }

    server.close(async () => {
      try {
        await disconnectDatabase();
        logger.info('[SHUTDOWN] Database disconnected cleanly. Exiting.');
        clearTimeout(forceTimer);
        process.exit(0);
      } catch (err: any) {
        logger.error({ err: err?.message }, '[SHUTDOWN] Error during database disconnect');
        process.exit(1);
      }
    });
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  logger.error({ err }, '[FATAL] Failed to bootstrap server');
  process.exit(1);
});

