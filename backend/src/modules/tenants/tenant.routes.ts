import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { tenantContext } from '../../middleware/tenant-context';
import { tenantService } from './tenant.service';
import { tenantProvisioningService } from './tenant-provisioning.service';

const router = Router();

// Tenant endpoints require authentication and tenant context
router.use(authenticate);
router.use(tenantContext);

/**
 * GET /api/v1/tenants/operations-overview
 * Enterprise operations center overview of all institutions.
 */
router.get(
  '/operations-overview',
  authorize('SUPER_ADMIN', 'ADMIN'),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const overview = tenantProvisioningService.getOperationsOverview(req.user as any);
      res.json({
        success: true,
        data: overview,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/tenants/onboard-wizard
 * Multi-step institutional onboarding and provisioning orchestrator.
 */
router.post(
  '/onboard-wizard',
  authorize('SUPER_ADMIN'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const summary = await tenantProvisioningService.onboardTenant(req.body, req.user as any);
      res.status(201).json({
        success: true,
        message: `Institution '${summary.name}' successfully provisioned and activated.`,
        data: summary,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/tenants
 * List accessible tenants (Super Admin: all; Staff: assigned tenant).
 */
router.get('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenants = tenantService.listTenants(req.user!);
    res.json({
      success: true,
      data: tenants,
      total: tenants.length,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/tenants/current
 * Returns active tenant context for the authenticated session.
 */
router.get('/current', (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({
      success: true,
      data: req.tenant,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/tenants/:id/setup-certificate
 * Generates institutional setup certificate.
 */
router.get('/:id/setup-certificate', (req: Request, res: Response, next: NextFunction) => {
  try {
    const cert = tenantProvisioningService.generateSetupCertificate(req.params.id, req.user as any);
    res.json({
      success: true,
      data: cert,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/tenants/:id
 * Get detailed tenant profile within authorized tenant boundary.
 */
router.get('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const scopedTenantId = tenantService.resolveTenantScope(req.user!, req.params.id);
    const tenant = tenantService.getTenantById(scopedTenantId);
    res.json({
      success: true,
      data: tenant,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/tenants
 * Onboard a new enterprise lender tenant (Super Admin only).
 */
router.post(
  '/',
  authorize('SUPER_ADMIN'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenant = await tenantService.createTenant(req.body, req.user!);
      res.status(201).json({
        success: true,
        message: `Tenant '${tenant.name}' successfully onboarded.`,
        data: tenant,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/tenants/:id/suspend
 * Suspend an institution.
 */
router.post(
  '/:id/suspend',
  authorize('SUPER_ADMIN'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { reason } = req.body;
      const tenant = await tenantProvisioningService.suspendTenant(req.params.id, reason, req.user as any);
      res.json({
        success: true,
        message: `Tenant '${tenant.name}' suspended.`,
        data: tenant,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/tenants/:id/reactivate
 * Reactivate a suspended institution.
 */
router.post(
  '/:id/reactivate',
  authorize('SUPER_ADMIN'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenant = await tenantProvisioningService.reactivateTenant(req.params.id, req.user as any);
      res.json({
        success: true,
        message: `Tenant '${tenant.name}' reactivated.`,
        data: tenant,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PATCH /api/v1/tenants/:id/status
 * Activate or suspend a lender tenant (Super Admin only).
 */
router.patch(
  '/:id/status',
  authorize('SUPER_ADMIN'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenant = await tenantService.updateTenantStatus(
        req.params.id,
        req.body.status,
        req.user!,
        req.body.reason
      );
      res.json({
        success: true,
        message: `Tenant '${tenant.name}' status updated to '${tenant.status}'.`,
        data: tenant,
      });
    } catch (err) {
      next(err);
    }
  }
);

export const tenantRoutes = router;
