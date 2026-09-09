import { Request, Response, NextFunction } from 'express';
import { v4 as uuid } from 'uuid';
import { observabilityService } from '../modules/observability/observability.service';

export function tracingMiddleware(req: Request, res: Response, next: NextFunction): void {
  const correlationId = (req.headers['x-correlation-id'] as string) || (req.headers['x-request-id'] as string) || `req-${uuid().slice(0, 8)}`;
  const startTime = Date.now();

  res.setHeader('X-Correlation-ID', correlationId);

  res.on('finish', () => {
    const durationMs = Date.now() - startTime;
    const tenantId = req.tenant?.tenantId || req.user?.tenantId || (req.headers['x-tenant-id'] as string) || 'system';

    observabilityService.recordRequest({
      tenantId,
      method: req.method,
      route: req.route?.path || req.path,
      statusCode: res.statusCode,
      durationMs,
      correlationId,
      timestamp: new Date().toISOString(),
    });
  });

  next();
}
