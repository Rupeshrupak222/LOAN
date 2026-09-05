import { Router, Request, Response } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { tenantContext } from '../../middleware/tenant-context';
import { tenantService } from './tenant.service';
import { tenantProvisioningService } from './tenant-provisioning.service';
import { asyncHandler } from '../../common/asyncHandler';

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
  asyncHandler(async (req: Request, res: Response) => {
    const overview = tenantProvisioningService.getOperationsOverview(req.user as any);
    res.json({
      success: true,
      data: overview,
    });
  })
);

/**
 * POST /api/v1/tenants/onboard-wizard
 * Multi-step institutional onboarding and provisioning orchestrator.
 */
router.post(
  '/onboard-wizard',
  authorize('SUPER_ADMIN'),
  asyncHandler(async (req: Request, res: Response) => {
    const summary = await tenantProvisioningService.onboardTenant(req.body, req.user as any);
    res.status(201).json({
      success: true,
      message: `Institution '${summary.name}' successfully provisioned and activated.`,
      data: summary,
    });
  })
);

/**
 * GET /api/v1/tenants
 * List accessible tenants (Super Admin: all; Staff: assigned tenant).
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const tenants = tenantService.listTenants(req.user!);
    res.json({
      success: true,
      data: tenants,
      total: tenants.length,
    });
  })
);

/**
 * GET /api/v1/tenants/current
 * Returns active tenant context for the authenticated session.
 */
router.get(
  '/current',
  asyncHandler(async (req: Request, res: Response) => {
    res.json({
      success: true,
      data: req.tenant,
    });
  })
);

/**
 * GET /api/v1/tenants/:id/setup-certificate
 * Generates institutional setup certificate.
 */
router.get(
  '/:id/setup-certificate',
  asyncHandler(async (req: Request, res: Response) => {
    const cert = tenantProvisioningService.generateSetupCertificate(req.params.id, req.user as any);
    res.json({
      success: true,
      data: cert,
    });
  })
);

/**
 * GET /api/v1/tenants/:id
 * Get detailed tenant profile within authorized tenant boundary.
 */
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const scopedTenantId = tenantService.resolveTenantScope(req.user!, req.params.id);
    const tenant = tenantService.getTenantById(scopedTenantId);
    res.json({
      success: true,
      data: tenant,
    });
  })
);

/**
 * POST /api/v1/tenants
 * Onboard a new enterprise lender tenant (Super Admin only).
 */
router.post(
  '/',
  authorize('SUPER_ADMIN'),
  asyncHandler(async (req: Request, res: Response) => {
    const tenant = await tenantService.createTenant(req.body, req.user!);
    res.status(201).json({
      success: true,
      message: `Tenant '${tenant.name}' successfully onboarded.`,
      data: tenant,
    });
  })
);

/**
 * POST /api/v1/tenants/:id/suspend
 * Suspend an institution.
 */
router.post(
  '/:id/suspend',
  authorize('SUPER_ADMIN'),
  asyncHandler(async (req: Request, res: Response) => {
    const { reason } = req.body;
    const tenant = await tenantProvisioningService.suspendTenant(req.params.id, reason, req.user as any);
    res.json({
      success: true,
      message: `Tenant '${tenant.name}' suspended.`,
      data: tenant,
    });
  })
);

/**
 * POST /api/v1/tenants/:id/reactivate
 * Reactivate a suspended institution.
 */
router.post(
  '/:id/reactivate',
  authorize('SUPER_ADMIN'),
  asyncHandler(async (req: Request, res: Response) => {
    const tenant = await tenantProvisioningService.reactivateTenant(req.params.id, req.user as any);
    res.json({
      success: true,
      message: `Tenant '${tenant.name}' reactivated.`,
      data: tenant,
    });
  })
);

/**
 * PATCH /api/v1/tenants/:id/status
 * Activate or suspend a lender tenant (Super Admin only).
 */
router.patch(
  '/:id/status',
  authorize('SUPER_ADMIN'),
  asyncHandler(async (req: Request, res: Response) => {
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
  })
);

export const tenantRoutes = router;
