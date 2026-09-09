import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { tenantContext } from '../../middleware/tenant-context';
import { brandingService } from './branding.service';
import { BadRequestError, ForbiddenError } from '../../common/errors';

const router = Router();

/**
 * GET /api/v1/branding/current
 * Resolves active institutional branding. Publicly accessible or authenticated.
 */
router.get('/current', (req: Request, res: Response, next: NextFunction) => {
  try {
    const headerTenantId = req.headers['x-tenant-id'] as string | undefined;
    const effectiveTenantId = headerTenantId || 'tenant-adyapan-default';
    const branding = brandingService.getTenantBranding(effectiveTenantId);

    res.json({
      success: true,
      data: branding,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/branding/:tenantId
 * Inspect specific tenant institutional branding.
 */
router.get('/:tenantId', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tenantId } = req.params;
    const branding = brandingService.getTenantBranding(tenantId);

    res.json({
      success: true,
      data: branding,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/v1/branding/:tenantId
 * Updates institutional branding. Requires SUPER_ADMIN or ADMIN.
 */
router.put(
  '/:tenantId',
  authenticate,
  tenantContext,
  authorize('SUPER_ADMIN', 'ADMIN'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId } = req.params;
      const isSuperAdmin = req.user?.roles.includes('SUPER_ADMIN');
      const userTenantId = req.user?.tenantId || 'tenant-adyapan-default';

      if (!isSuperAdmin && userTenantId !== tenantId) {
        throw new ForbiddenError("Cannot modify another institution's branding profile.");
      }

      const updated = await brandingService.updateTenantBranding(
        tenantId,
        req.body,
        req.user as any
      );

      res.json({
        success: true,
        message: `Institutional branding for '${updated.institutionName}' successfully updated.`,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }
);

export const brandingRoutes = router;
