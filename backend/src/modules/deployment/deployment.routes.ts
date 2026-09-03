import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { tenantContext } from '../../middleware/tenant-context';
import { deploymentService } from './deployment.service';

const router = Router();

/**
 * GET /api/v1/deployment/profile
 * Public/authenticated view of active deployment model & runtime profile.
 */
router.get('/profile', (req: Request, res: Response) => {
  const profile = deploymentService.getDeploymentProfile();
  res.json({
    success: true,
    data: profile,
  });
});

/**
 * GET /api/v1/deployment/detailed-health
 * Deep diagnostic health check covering DB, Storage, Cache, and Audit Ledger.
 */
router.get('/detailed-health', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const health = await deploymentService.getDetailedHealthStatus();
    const statusCode = health.status === 'HEALTHY' ? 200 : 503;
    res.status(statusCode).json({
      success: health.status === 'HEALTHY',
      data: health,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/deployment/preflight
 * Super Admin pre-deployment verification check.
 */
router.get(
  '/preflight',
  authenticate,
  tenantContext,
  authorize('SUPER_ADMIN'),
  (req: Request, res: Response) => {
    const report = deploymentService.runPreflightValidation();
    res.json({
      success: report.passed,
      data: report,
    });
  }
);

/**
 * GET /api/v1/deployment/rollback-plan
 * Super Admin rollback plan generator for zero-downtime releases.
 */
router.get(
  '/rollback-plan',
  authenticate,
  tenantContext,
  authorize('SUPER_ADMIN'),
  (req: Request, res: Response) => {
    const fromVersion = (req.query.fromVersion as string) || '2.4.0';
    const toVersion = (req.query.toVersion as string) || '2.3.9';
    const plan = deploymentService.generateRollbackPlan(fromVersion, toVersion);

    res.json({
      success: true,
      data: plan,
    });
  }
);

export const deploymentRoutes = router;
