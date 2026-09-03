import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { tenantContext } from '../../middleware/tenant-context';
import { integrationCertificationService } from './certification.service';
import { BadRequestError } from '../../common/errors';

const router = Router();

router.use(authenticate);
router.use(tenantContext);
router.use(authorize('SUPER_ADMIN', 'ADMIN', 'AUDITOR'));

/**
 * GET /api/v1/integrations/certification/overview
 * Overview of integration certification matrix, health, and SLAs.
 */
router.get('/overview', (req: Request, res: Response) => {
  const tenantId = req.user?.roles.includes('SUPER_ADMIN') ? '*' : req.tenant?.tenantId || 'tenant-adyapan-default';
  const overview = integrationCertificationService.getCertificationOverview(tenantId);

  res.json({
    success: true,
    data: overview,
  });
});

/**
 * GET /api/v1/integrations/certification/connectors
 * Lists certified connectors.
 */
router.get('/connectors', (req: Request, res: Response) => {
  const tenantId = req.user?.roles.includes('SUPER_ADMIN') ? '*' : req.tenant?.tenantId || 'tenant-adyapan-default';
  const category = req.query.category as string | undefined;
  const status = req.query.status as any;

  const connectors = integrationCertificationService.listConnectors(tenantId, { category, status });

  res.json({
    success: true,
    data: connectors,
    total: connectors.length,
  });
});

/**
 * POST /api/v1/integrations/certification/audit-health
 * Executes live health check audit across all connectors.
 */
router.post('/audit-health', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenant?.tenantId || 'tenant-adyapan-default';
    const audited = await integrationCertificationService.runHealthAudit(tenantId, req.user as any);

    res.json({
      success: true,
      message: `Health audit completed for ${audited.length} connectors.`,
      data: audited,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/integrations/certification/test-failover
 * Simulates primary connector outage and validates seamless failover to secondary provider.
 */
router.post('/test-failover', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.tenant?.tenantId || 'tenant-adyapan-default';
    const { connectorId } = req.body;

    if (!connectorId) {
      throw new BadRequestError('connectorId is required.');
    }

    const result = await integrationCertificationService.testConnectorFailover(tenantId, connectorId, req.user as any);

    res.json({
      success: true,
      message: `Failover test completed for connector '${connectorId}'. Fallback to '${result.fallbackProvider}' succeeded.`,
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

export const certificationRoutes = router;
