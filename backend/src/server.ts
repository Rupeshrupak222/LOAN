import { createApp } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { connectDatabase, disconnectDatabase } from './config/prisma';

async function bootstrap() {
  await connectDatabase();
  const app = createApp();

  const server = app.listen(env.port, () => {
    logger.info(`Adyapan LMS API running on http://localhost:${env.port}${env.apiPrefix}`);
    logger.info(`API docs at http://localhost:${env.port}/api/docs`);
  });

  const shutdown = async (signal: string) => {
    logger.info(`${signal} received, shutting down...`);
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  logger.error({ err }, 'Failed to start server');
  process.exit(1);
});
