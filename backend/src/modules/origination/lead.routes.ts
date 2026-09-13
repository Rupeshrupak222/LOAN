import { Router } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { ok, created } from '../../common/response';
import { authenticate, authorize } from '../../middleware/auth';
import { tenantContext } from '../../middleware/tenant-context';
import { leadService } from './lead.service';

const router = Router();
router.use(authenticate);
router.use(tenantContext);

const ORIGINATION_ROLES = [
  'SUPER_ADMIN',
  'COMPANY_ADMIN',
  'ADMIN',
  'LOAN_OFFICER',
  'BRANCH_MANAGER',
  'PARTNER_ADMIN',
  'PARTNER_OPERATIONS',
  'PARTNER_AGENT',
];

/**
 * GET /api/v1/leads
 * Lists leads scoped to tenant and branch.
 */
router.get(
  '/',
  authorize(...ORIGINATION_ROLES),
  asyncHandler(async (req, res) => {
    const status = typeof req.query.status === 'string' ? (req.query.status as any) : undefined;
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const source = typeof req.query.source === 'string' ? (req.query.source as any) : undefined;

    const result = await leadService.listLeads(
      { status, search, source },
      {
        id: req.user?.id,
        email: req.user?.email,
        roles: req.user?.roles,
        tenantId: req.tenantId || req.user?.tenantId,
        branchId: req.user?.branchId,
      }
    );

    return ok(res, result.data);
  })
);

/**
 * GET /api/v1/leads/:id
 * Retrieves single lead details.
 */
router.get(
  '/:id',
  authorize(...ORIGINATION_ROLES),
  asyncHandler(async (req, res) => {
    const lead = await leadService.getLead(req.params.id, {
      id: req.user?.id,
      email: req.user?.email,
      roles: req.user?.roles,
      tenantId: req.tenantId || req.user?.tenantId,
      branchId: req.user?.branchId,
    });
    return ok(res, lead);
  })
);

/**
 * POST /api/v1/leads
 * Creates new origination lead.
 */
router.post(
  '/',
  authorize(...ORIGINATION_ROLES),
  asyncHandler(async (req, res) => {
    const lead = await leadService.createLead(req.body, {
      id: req.user?.id,
      email: req.user?.email,
      roles: req.user?.roles,
      tenantId: req.tenantId || req.user?.tenantId,
      branchId: req.user?.branchId,
    });
    return created(res, lead);
  })
);

/**
 * PATCH /api/v1/leads/:id
 * Updates lead status or details.
 */
router.patch(
  '/:id',
  authorize(...ORIGINATION_ROLES),
  asyncHandler(async (req, res) => {
    const updated = await leadService.updateLead(req.params.id, req.body, {
      id: req.user?.id,
      email: req.user?.email,
      roles: req.user?.roles,
      tenantId: req.tenantId || req.user?.tenantId,
      branchId: req.user?.branchId,
    });
    return ok(res, updated);
  })
);

/**
 * POST /api/v1/leads/:id/convert
 * Converts lead into Customer and Loan Application.
 */
router.post(
  '/:id/convert',
  authorize(...ORIGINATION_ROLES),
  asyncHandler(async (req, res) => {
    const result = await leadService.convertLeadToApplication(req.params.id, req.body, {
      id: req.user?.id,
      email: req.user?.email,
      roles: req.user?.roles,
      tenantId: req.tenantId || req.user?.tenantId,
      branchId: req.user?.branchId,
    });
    return ok(res, result);
  })
);

export default router;
