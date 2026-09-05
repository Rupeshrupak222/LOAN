import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

export interface TimeoutOptions {
  defaultTimeoutMs?: number;
  aiTimeoutMs?: number;
  uploadTimeoutMs?: number;
  exportTimeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 25_000;
const AI_TIMEOUT_MS = 45_000;
const UPLOAD_TIMEOUT_MS = 60_000;
const EXPORT_TIMEOUT_MS = 45_000;

/**
 * Production-Grade Request Timeout Middleware
 *
 * Ensures no incoming HTTP request can hang indefinitely due to downstream database locks,
 * external integration latency, or AI execution delays.
 */
export function requestTimeout(options: TimeoutOptions = {}) {
  const defaultMs = options.defaultTimeoutMs ?? DEFAULT_TIMEOUT_MS;
  const aiMs = options.aiTimeoutMs ?? AI_TIMEOUT_MS;
  const uploadMs = options.uploadTimeoutMs ?? UPLOAD_TIMEOUT_MS;
  const exportMs = options.exportTimeoutMs ?? EXPORT_TIMEOUT_MS;

  return (req: Request, res: Response, next: NextFunction): void => {
    let timeoutMs = defaultMs;

    const path = req.originalUrl || req.path || '';
    if (path.includes('/ai/') || path.includes('intelligence') || path.includes('simulate')) {
      timeoutMs = aiMs;
    } else if (path.includes('/documents/upload') || req.headers['content-type']?.includes('multipart/form-data')) {
      timeoutMs = uploadMs;
    } else if (path.includes('/reports/export') || path.includes('/export')) {
      timeoutMs = exportMs;
    }

    const timer = setTimeout(() => {
      if (!res.headersSent) {
        logger.warn(
          {
            method: req.method,
            path: req.originalUrl,
            timeoutMs,
            correlationId: req.headers['x-correlation-id'],
          },
          'Request timed out on server'
        );

        res.status(504).json({
          success: false,
          error: {
            code: 'GATEWAY_TIMEOUT',
            message: 'Request is taking longer than expected. Please try again.',
            details: {
              timeoutMs,
              path: req.originalUrl,
            },
          },
        });
      }
    }, timeoutMs);

    // Unref timer so Node process is not prevented from exiting
    if (typeof timer.unref === 'function') {
      timer.unref();
    }

    const cleanup = () => {
      clearTimeout(timer);
    };

    res.once('finish', cleanup);
    res.once('close', cleanup);

    next();
  };
}
