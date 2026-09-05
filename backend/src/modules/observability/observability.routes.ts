import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { tenantContext } from '../../middleware/tenant-context';
import { observabilityService } from './observability.service';
import { BadRequestError } from '../../common/errors';

const router = Router();

/**
 * Public/Scraper Prometheus Metrics Endpoint
 * GET /metrics or GET /api/v1/observability/metrics
 */
router.get(['/metrics', '/observability/metrics'], (_req: Request, res: Response) => {
  const metrics = observabilityService.formatPrometheusMetrics();
  res.setHeader('Content-Type', 'text/plain; version=0.0.4');
  res.send(metrics);
});

// Authenticated & Scoped Operations Endpoints
router.use(authenticate);
router.use(tenantContext);

/**
 * GET /api/v1/observability/overview
 * Real-time operational dashboard overview.
 */
router.get(
  '/observability/overview',
  authorize('SUPER_ADMIN', 'ADMIN', 'AUDITOR', 'BRANCH_MANAGER'),
  (req: Request, res: Response) => {
    const tenantId = req.tenant?.tenantId || 'tenant-adyapan-default';
    const overview = observabilityService.getOverview(tenantId);

    res.json({
      success: true,
      data: overview,
    });
  }
);

/**
 * GET /api/v1/observability/alerts
 * Active operational alerts stream.
 */
router.get(
  '/observability/alerts',
  authorize('SUPER_ADMIN', 'ADMIN', 'AUDITOR', 'BRANCH_MANAGER'),
  (req: Request, res: Response) => {
    const tenantId = req.user?.roles.includes('SUPER_ADMIN') ? undefined : req.tenant?.tenantId;
    const alerts = observabilityService.listAlerts(tenantId);

    res.json({
      success: true,
      data: alerts,
      total: alerts.length,
    });
  }
);

/**
 * POST /api/v1/observability/alerts/:alertId/ack
 * Acknowledges an active operational alert.
 */
router.post(
  '/observability/alerts/:alertId/ack',
  authorize('SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER'),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const alert = observabilityService.acknowledgeAlert(req.params.alertId, req.user as any);
      res.json({
        success: true,
        message: `Alert '${alert.id}' acknowledged.`,
        data: alert,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/observability/alerts
 * Triggers a manual or automated operational alert.
 */
router.post(
  '/observability/alerts',
  authorize('SUPER_ADMIN', 'ADMIN'),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const { severity, title, message, source } = req.body;
      if (!severity || !title || !message) {
        throw new BadRequestError('Severity, title, and message are required.');
      }

      const tenantId = req.tenant?.tenantId || 'tenant-adyapan-default';
      const alert = observabilityService.createAlert({
        tenantId,
        severity,
        title,
        message,
        source: source || 'OPERATIONS_CONSOLE',
      });

      res.status(201).json({
        success: true,
        data: alert,
      });
    } catch (err) {
      next(err);
    }
  }
);

export const observabilityRoutes = router;
