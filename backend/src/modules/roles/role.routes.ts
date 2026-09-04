import { Router, Request, Response } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { tenantContext } from '../../middleware/tenant-context';
import { rolePermissionService } from './role-permission.service';
import { asyncHandler } from '../../common/asyncHandler';

const router = Router();

router.use(authenticate);
router.use(tenantContext);

/**
 * GET /api/v1/roles/permissions-matrix
 * Full catalog of available granular permissions grouped by domain.
 */
router.get(
  '/permissions-matrix',
  asyncHandler(async (_req: Request, res: Response) => {
    const catalog = rolePermissionService.getPermissionCatalog();
    res.json({
      success: true,
      data: catalog,
      total: catalog.length,
    });
  })
);

/**
 * GET /api/v1/roles/sod-rules
 * Banking Segregation of Duties (SoD) conflict rules.
 */
router.get(
  '/sod-rules',
  asyncHandler(async (_req: Request, res: Response) => {
    const rules = rolePermissionService.getSodRules();
    res.json({
      success: true,
      data: rules,
      total: rules.length,
    });
  })
);

/**
 * POST /api/v1/roles/check-sod
 * Tests a candidate list of permissions for SoD conflicts in real-time.
 */
router.post(
  '/check-sod',
  asyncHandler(async (req: Request, res: Response) => {
    const { permissions } = req.body;
    const result = rolePermissionService.checkSodConflicts(permissions || []);
    res.json({
      success: true,
      data: result,
    });
  })
);

/**
 * GET /api/v1/roles/effective-permissions
 * Returns effective permission codes for the current authenticated user.
 */
router.get(
  '/effective-permissions',
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.user?.tenantId || 'tenant-adyapan-default';
    const perms = rolePermissionService.getEffectivePermissions(req.user?.roles || [], tenantId);
    res.json({
      success: true,
      data: {
        roles: req.user?.roles || [],
        effectivePermissions: perms,
        total: perms.length,
      },
    });
  })
);

/**
 * GET /api/v1/roles
 * Lists all active roles (system + custom) for current tenant.
 */
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.user?.tenantId || 'tenant-adyapan-default';
    const roles = rolePermissionService.listRoles(tenantId);
    res.json({
      success: true,
      data: roles,
      total: roles.length,
    });
  })
);

/**
 * POST /api/v1/roles
 * Creates a custom role with optional inheritance and SoD checks.
 */
router.post(
  '/',
  authorize('SUPER_ADMIN', 'ADMIN'),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.user?.tenantId || 'tenant-adyapan-default';
    const role = await rolePermissionService.createCustomRole(tenantId, req.body, req.user as any);
    res.status(201).json({
      success: true,
      message: `Custom role '${role.name}' (${role.code}) created successfully.`,
      data: role,
    });
  })
);

/**
 * PUT /api/v1/roles/:id
 * Updates custom role permissions or sign-off limits.
 */
router.put(
  '/:id',
  authorize('SUPER_ADMIN', 'ADMIN'),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.user?.tenantId || 'tenant-adyapan-default';
    const role = await rolePermissionService.updateRole(tenantId, req.params.id, req.body, req.user as any);
    res.json({
      success: true,
      message: `Role '${role.name}' updated successfully.`,
      data: role,
    });
  })
);

export const roleRoutes = router;
