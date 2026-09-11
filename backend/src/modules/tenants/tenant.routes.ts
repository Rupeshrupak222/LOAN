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
  authorize('SUPER_ADMIN', 'ADMIN', 'COMPANY_ADMIN'),
  asyncHandler(async (req: Request, res: Response) => {
    const overview = await tenantProvisioningService.getOperationsOverview(req.user as any);
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
      message: `Institution '${summary.name}' successfully provisioned and activated in PostgreSQL.`,
      data: summary,
    });
  })
);

/**
 * POST /api/v1/tenants/provision
 * Direct transactional tenant provisioning endpoint.
 */
router.post(
  '/provision',
  authorize('SUPER_ADMIN'),
  asyncHandler(async (req: Request, res: Response) => {
    const summary = await tenantProvisioningService.onboardTenant(req.body, req.user as any);
    res.status(201).json({
      success: true,
      message: `Institution '${summary.name}' successfully provisioned.`,
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
    const tenants = await tenantService.listTenants(req.user!);
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
    const cert = await tenantProvisioningService.generateSetupCertificate(req.params.id, req.user as any);
    res.json({
      success: true,
      data: cert,
    });
  })
);

/**
 * GET /api/v1/tenants/:id/detail
 * Comprehensive tenant detail inspection (Super Admin & Company Admin).
 */
router.get(
  '/:id/detail',
  asyncHandler(async (req: Request, res: Response) => {
    const detail = await tenantService.getTenantDetail(req.params.id, req.user!);
    res.json({
      success: true,
      data: detail,
    });
  })
);

/**
 * GET /api/v1/tenants/:id/readiness
 * Evaluates tenant readiness across 8 distinct operational domains.
 */
router.get(
  '/:id/readiness',
  asyncHandler(async (req: Request, res: Response) => {
    const scopedTenantId = tenantService.resolveTenantScope(req.user!, req.params.id);
    const readiness = await tenantService.evaluateTenantReadiness(scopedTenantId);
    res.json({
      success: true,
      data: readiness,
    });
  })
);

/**
 * GET /api/v1/tenants/:id/configuration
 * Returns unified multi-engine configuration bundle for tenant.
 */
router.get(
  '/:id/configuration',
  asyncHandler(async (req: Request, res: Response) => {
    const bundle = await tenantService.getTenantConfiguration(req.params.id, req.user!);
    res.json({
      success: true,
      data: bundle,
    });
  })
);

/**
 * GET /api/v1/tenants/:id/branding
 * Retrieves tenant white-label branding configuration.
 */
router.get(
  '/:id/branding',
  asyncHandler(async (req: Request, res: Response) => {
    const scopedTenantId = tenantService.resolveTenantScope(req.user!, req.params.id);
    const branding = tenantService.getTenantBranding(scopedTenantId);
    res.json({
      success: true,
      data: branding,
    });
  })
);

/**
 * PUT /api/v1/tenants/:id/branding
 * Updates tenant white-label branding configuration with contrast validation.
 */
router.put(
  '/:id/branding',
  authorize('SUPER_ADMIN', 'ADMIN', 'COMPANY_ADMIN'),
  asyncHandler(async (req: Request, res: Response) => {
    const branding = await tenantService.updateTenantBranding(req.params.id, req.body, req.user as any);
    res.json({
      success: true,
      message: 'Tenant branding updated successfully.',
      data: branding,
    });
  })
);

/**
 * GET /api/v1/tenants/:id/branches
 * Lists all operational branches for tenant.
 */
router.get(
  '/:id/branches',
  asyncHandler(async (req: Request, res: Response) => {
    const branches = await tenantService.listTenantBranches(req.params.id, req.user!);
    res.json({
      success: true,
      data: branches,
      total: branches.length,
    });
  })
);

/**
 * POST /api/v1/tenants/:id/branches
 * Creates a new branch under the specified tenant.
 */
router.post(
  '/:id/branches',
  authorize('SUPER_ADMIN', 'ADMIN', 'COMPANY_ADMIN'),
  asyncHandler(async (req: Request, res: Response) => {
    const branch = await tenantService.createTenantBranch(req.params.id, req.body, req.user!);
    res.status(201).json({
      success: true,
      message: `Branch '${branch.name}' created successfully.`,
      data: branch,
    });
  })
);

/**
 * GET /api/v1/tenants/:id/users
 * Lists staff users belonging to tenant.
 */
router.get(
  '/:id/users',
  authorize('SUPER_ADMIN', 'ADMIN', 'COMPANY_ADMIN'),
  asyncHandler(async (req: Request, res: Response) => {
    const users = await tenantService.listTenantUsers(req.params.id, req.user!);
    res.json({
      success: true,
      data: users,
      total: users.length,
    });
  })
);

/**
 * POST /api/v1/tenants/:id/users
 * Provisions/invites a new staff user under the specified tenant.
 */
router.post(
  '/:id/users',
  authorize('SUPER_ADMIN', 'ADMIN', 'COMPANY_ADMIN'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = await tenantService.createTenantUser(req.params.id, req.body, req.user!);
    res.status(201).json({
      success: true,
      message: `Staff user '${user.email}' provisioned successfully under role '${user.role}'.`,
      data: user,
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
    const tenant = await tenantService.getTenantByIdAsync(scopedTenantId);
    res.json({
      success: true,
      data: tenant,
    });
  })
);

/**
 * PATCH /api/v1/tenants/:id
 * Update tenant profile and settings.
 */
router.patch(
  '/:id',
  authorize('SUPER_ADMIN', 'ADMIN', 'COMPANY_ADMIN'),
  asyncHandler(async (req: Request, res: Response) => {
    const tenant = await tenantService.updateTenant(req.params.id, req.body, req.user!);
    res.json({
      success: true,
      message: `Tenant '${tenant.name}' updated successfully.`,
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
      message: `Tenant '${tenant.name}' successfully onboarded in PostgreSQL.`,
      data: tenant,
    });
  })
);

/**
 * POST /api/v1/tenants/:id/activate
 * Activate a tenant (Enforces Readiness Check).
 */
router.post(
  '/:id/activate',
  authorize('SUPER_ADMIN'),
  asyncHandler(async (req: Request, res: Response) => {
    const tenant = await tenantService.activateTenant(req.params.id, req.user as any);
    res.json({
      success: true,
      message: `Tenant '${tenant.name}' activated successfully.`,
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
    const tenant = await tenantService.suspendTenant(req.params.id, reason, req.user as any);
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
