import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { tenantContext } from '../../middleware/tenant-context';
import { tenantIntegrationService } from './tenant-integrations.service';
import { IntegrationCategory } from './integration.types';
import { BadRequestError, ForbiddenError } from '../../common/errors';

const router = Router();

router.use(authenticate);
router.use(tenantContext);

/**
 * GET /api/v1/integrations/tenant
 * Returns all active provider routings for the authenticated tenant with masked credentials.
 */
router.get('/tenant', (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.user?.roles.includes('CUSTOMER')) {
      throw new ForbiddenError('Access forbidden: Borrowers cannot view Integration Hub configurations.');
    }

    const tenantId = req.tenant?.tenantId || 'tenant-adyapan-default';
    const routings = tenantIntegrationService.getTenantRoutings(tenantId);

    res.json({
      success: true,
      data: routings,
      total: routings.length,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/integrations/tenant/:category
 * Returns routing for a specific category.
 */
router.get('/tenant/:category', (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.user?.roles.includes('CUSTOMER')) {
      throw new ForbiddenError('Access forbidden: Borrowers cannot view Integration Hub configurations.');
    }

    const tenantId = req.tenant?.tenantId || 'tenant-adyapan-default';
    const category = req.params.category.toUpperCase() as IntegrationCategory;
    const routing = tenantIntegrationService.getTenantRoutingForCategory(tenantId, category);

    res.json({
      success: true,
      data: routing || null,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/v1/integrations/tenant/:category
 * Upserts provider credentials and routing for a category. Requires SUPER_ADMIN or ADMIN.
 */
router.put(
  '/tenant/:category',
  authorize('SUPER_ADMIN', 'ADMIN'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.tenant?.tenantId || 'tenant-adyapan-default';
      const category = req.params.category.toUpperCase() as IntegrationCategory;

      const updated = await tenantIntegrationService.upsertTenantRouting(
        tenantId,
        category,
        req.body,
        req.user as any
      );

      res.json({
        success: true,
        message: `Tenant routing for category '${category}' successfully configured with primary provider '${updated.primaryProvider}'.`,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/integrations/tenant/:category/test
 * Dispatches test health probe using tenant-specific credentials.
 */
router.post(
  '/tenant/:category/test',
  authorize('SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = req.tenant?.tenantId || 'tenant-adyapan-default';
      const category = req.params.category.toUpperCase() as IntegrationCategory;

      const result = await tenantIntegrationService.dispatchTenantOperation(
        tenantId,
        category,
        'PING_PROBE',
        { timestamp: new Date().toISOString() }
      );

      res.json({
        success: true,
        message: `Test probe succeeded using '${result.providerUsed}' (${result.isFallback ? 'Secondary Fallback' : 'Primary'}).`,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
);

export const tenantIntegrationRoutes = router;
