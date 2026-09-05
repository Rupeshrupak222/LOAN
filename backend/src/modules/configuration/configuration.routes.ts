import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { tenantContext } from '../../middleware/tenant-context';
import { configurationService } from './configuration.service';
import { ConfigArea } from './configuration.types';
import { BadRequestError } from '../../common/errors';

const router = Router();

router.use(authenticate);
router.use(tenantContext);

/**
 * GET /api/v1/configuration/active?area=FOIR_DTI
 * Get active published configuration for the authenticated tenant.
 */
router.get(
  '/active',
  authorize(
    'SUPER_ADMIN',
    'ADMIN',
    'BRANCH_MANAGER',
    'CREDIT_ANALYST',
    'UNDERWRITER',
    'AUDITOR',
    'FINANCE_OFFICER',
    'LOAN_OFFICER'
  ),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const area = req.query.area as ConfigArea;
      if (!area) {
        throw new BadRequestError("Query parameter 'area' is required.");
      }
      const tenantId = req.tenant?.tenantId || 'tenant-adyapan-default';
      const config = configurationService.getTenantConfig(tenantId, area);
      const record = configurationService.getActiveConfigRecord(tenantId, area);

      res.json({
        success: true,
        data: {
          tenantId,
          area,
          version: record?.version || 1,
          effectiveFrom: record?.effectiveFrom,
          parameters: config,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/configuration/versions?area=FOIR_DTI
 * Returns audit version history of configurations for a given area.
 */
router.get(
  '/versions',
  authorize('SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER', 'AUDITOR'),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const area = req.query.area as ConfigArea;
      if (!area) {
        throw new BadRequestError("Query parameter 'area' is required.");
      }
      const tenantId = req.tenant?.tenantId || 'tenant-adyapan-default';
      const versions = configurationService.listConfigVersions(tenantId, area);

      res.json({
        success: true,
        data: versions,
        total: versions.length,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/configuration/draft
 * Create a draft policy configuration.
 */
router.post(
  '/draft',
  authorize('SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.tenant?.tenantId || 'tenant-adyapan-default';
      const draft = await configurationService.saveDraftConfig(
        tenantId,
        req.body,
        req.user as any
      );

      res.status(201).json({
        success: true,
        message: `Draft configuration created for area '${draft.area}' (Version ${draft.version}).`,
        data: draft,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/configuration/publish
 * Promote a draft configuration to PUBLISHED state.
 */
router.post(
  '/publish',
  authorize('SUPER_ADMIN', 'ADMIN'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.tenant?.tenantId || 'tenant-adyapan-default';
      const { configId, effectiveFrom } = req.body;
      if (!configId) {
        throw new BadRequestError("'configId' is required to publish.");
      }

      const published = await configurationService.publishConfig(
        tenantId,
        configId,
        req.user as any,
        effectiveFrom
      );

      res.json({
        success: true,
        message: `Configuration '${published.id}' successfully published as active policy.`,
        data: published,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/configuration/rollback
 * Rollback to a previous approved policy version with documented justification.
 */
router.post(
  '/rollback',
  authorize('SUPER_ADMIN', 'ADMIN'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.tenant?.tenantId || 'tenant-adyapan-default';
      const { area, targetVersion, reason } = req.body;

      if (!area || !targetVersion || !reason) {
        throw new BadRequestError("'area', 'targetVersion', and 'reason' are required for rollback.");
      }

      const rolledBack = await configurationService.rollbackConfig(
        tenantId,
        area,
        Number(targetVersion),
        req.user as any,
        reason
      );

      res.json({
        success: true,
        message: `Policy area '${area}' rolled back to version ${targetVersion} parameters. New active version is ${rolledBack.version}.`,
        data: rolledBack,
      });
    } catch (err) {
      next(err);
    }
  }
);

export const configurationRoutes = router;
