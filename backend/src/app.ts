import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { logger } from './config/logger';
import { globalLimiter } from './middleware/rateLimiter';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import apiRoutes from './routes';
import healthRoutes from './routes/health.routes';
import { openApiDocument } from './docs/openapi';
import { tracingMiddleware } from './middleware/tracing';
import { requestTimeout } from './middleware/timeout';
import { observabilityService } from './modules/observability/observability.service';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(helmet());
  const allowedOrigins = env.corsOrigins;
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. server-to-server, mobile app, health checkers)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin) || (!env.isProduction && (origin.includes('localhost') || origin.includes('127.0.0.1')))) {
          return callback(null, true);
        }
        return callback(new Error(`Origin '${origin}' not allowed by CORS policy.`));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Correlation-ID',
        'X-Request-ID',
        'X-Tenant-ID',
        'Idempotency-Key',
      ],
      exposedHeaders: ['X-Correlation-ID'],
      maxAge: 86400,
    }),
  );
  app.use(compression());
  app.use(requestTimeout());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(pinoHttp({ logger }));
  app.use(tracingMiddleware);
  app.use(globalLimiter);

  // Prometheus Metrics Scrape Endpoint
  app.get('/metrics', (_req, res) => {
    const metrics = observabilityService.formatPrometheusMetrics();
    res.setHeader('Content-Type', 'text/plain; version=0.0.4');
    res.send(metrics);
  });

  // Health checks
  app.use(healthRoutes);
  app.use(env.apiPrefix, healthRoutes);

  // API docs
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiDocument));

  // Serve uploaded files statically
  app.use('/uploads', express.static('uploads'));

  // Versioned API
  app.use(env.apiPrefix, apiRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
