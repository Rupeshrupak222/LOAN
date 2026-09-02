import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../common/errors';
import { env } from '../config/env';
import { logger } from '../config/logger';

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: `Route not found: ${req.method} ${req.originalUrl}` },
  });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ZodError) {
    res.status(422).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      },
    });
    return;
  }

  const anyErr = err as any;
  if (err instanceof AppError || (anyErr && typeof anyErr.statusCode === 'number' && anyErr.code)) {
    const statusCode = anyErr.statusCode || 500;
    if (statusCode >= 500) {
      logger.error({ err, path: req.originalUrl }, 'Application error');
    }
    res.status(statusCode).json({
      success: false,
      error: { code: anyErr.code || 'APP_ERROR', message: anyErr.message, details: anyErr.details },
    });
    return;
  }

  // Multer Errors (e.g. file too large)
  if (anyErr?.name === 'MulterError') {
    res.status(400).json({
      success: false,
      error: {
        code: 'FILE_UPLOAD_ERROR',
        message: anyErr.message || 'File upload failed',
      },
    });
    return;
  }

  logger.error({ err, path: req.originalUrl }, 'Unhandled error');
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: (err as Error)?.message || 'An unexpected error occurred',
      // Never expose stack traces in production
      ...(env.isProduction ? {} : { debug: (err as Error)?.message }),
    },
  });
}
