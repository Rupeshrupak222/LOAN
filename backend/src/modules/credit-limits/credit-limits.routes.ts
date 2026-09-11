/**
 * Adyapan Lending OS — Phase 5: Credit Limit Engine REST API Routes
 */

import { Router, Request, Response } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { tenantContext } from '../../middleware/tenant-context';
import { creditLimitsService } from './credit-limits.service';
import { CreditActorContext } from './credit-limits.types';
import { asyncHandler } from '../../common/asyncHandler';
import { ok, created } from '../../common/response';

function extractActor(req: Request): CreditActorContext {
  const user = (req as any).user;
  return {
    id: user?.id,
    email: user?.email,
    roles: user?.roles || (user?.role ? [user.role] : []),
    tenantId: req.tenantId || user?.tenantId,
    branchId: user?.branchId,
    firstName: user?.firstName,
    lastName: user?.lastName,
  };
}

export const creditFacilityRoutes = Router();
export const creditPolicyRoutes = Router();
export const drawdownRoutes = Router();

// =============================================================================
// 1. CREDIT FACILITIES ENDPOINTS
// =============================================================================

creditFacilityRoutes.use(authenticate);
creditFacilityRoutes.use(tenantContext);

/**
 * GET /api/v1/credit-facilities
 */
creditFacilityRoutes.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const actor = extractActor(req);
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const customerId = typeof req.query.customerId === 'string' ? req.query.customerId : undefined;

    const facilities = creditLimitsService.listFacilities({ search, status, customerId }, actor);
    return ok(res, facilities);
  })
);

/**
 * POST /api/v1/credit-facilities/simulate
 */
creditFacilityRoutes.post(
  '/simulate',
  asyncHandler(async (req: Request, res: Response) => {
    const result = creditLimitsService.simulateLimit(req.body);
    return ok(res, result);
  })
);

/**
 * GET /api/v1/credit-facilities/customer/:customerId/exposure
 */
creditFacilityRoutes.get(
  '/customer/:customerId/exposure',
  asyncHandler(async (req: Request, res: Response) => {
    const actor = extractActor(req);
    const summary = await creditLimitsService.getCustomerExposure(req.params.customerId, actor);
    return ok(res, summary);
  })
);

/**
 * POST /api/v1/credit-facilities/from-offer/:offerId
 */
creditFacilityRoutes.post(
  '/from-offer/:offerId',
  asyncHandler(async (req: Request, res: Response) => {
    const actor = extractActor(req);
    const facility = creditLimitsService.createFacilityFromOffer(req.params.offerId, actor);
    return created(res, facility);
  })
);

/**
 * GET /api/v1/credit-facilities/:id
 */
creditFacilityRoutes.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const actor = extractActor(req);
    const facility = creditLimitsService.getFacility(req.params.id, actor);
    return ok(res, facility);
  })
);

/**
 * POST /api/v1/credit-facilities/:id/drawdowns
 */
creditFacilityRoutes.post(
  '/:id/drawdowns',
  asyncHandler(async (req: Request, res: Response) => {
    const actor = extractActor(req);
    const drawdown = await creditLimitsService.requestDrawdown(req.params.id, req.body, actor);
    return created(res, drawdown);
  })
);

/**
 * GET /api/v1/credit-facilities/:id/drawdowns
 */
creditFacilityRoutes.get(
  '/:id/drawdowns',
  asyncHandler(async (req: Request, res: Response) => {
    const actor = extractActor(req);
    const facility = creditLimitsService.getFacility(req.params.id, actor);
    return ok(res, facility.drawdowns || []);
  })
);

/**
 * GET /api/v1/credit-facilities/:id/transactions
 */
creditFacilityRoutes.get(
  '/:id/transactions',
  asyncHandler(async (req: Request, res: Response) => {
    const actor = extractActor(req);
    const transactions = creditLimitsService.getTransactions(req.params.id, actor);
    return ok(res, transactions);
  })
);

/**
 * GET /api/v1/credit-facilities/:id/adjustments
 */
creditFacilityRoutes.get(
  '/:id/adjustments',
  asyncHandler(async (req: Request, res: Response) => {
    const actor = extractActor(req);
    const adjustments = creditLimitsService.getAdjustments(req.params.id, actor);
    return ok(res, adjustments);
  })
);

/**
 * POST /api/v1/credit-facilities/:id/adjust
 */
creditFacilityRoutes.post(
  '/:id/adjust',
  asyncHandler(async (req: Request, res: Response) => {
    const actor = extractActor(req);
    const updated = creditLimitsService.adjustLimit(req.params.id, req.body, actor);
    return ok(res, updated);
  })
);

/**
 * POST /api/v1/credit-facilities/:id/increase
 */
creditFacilityRoutes.post(
  '/:id/increase',
  asyncHandler(async (req: Request, res: Response) => {
    const actor = extractActor(req);
    const updated = creditLimitsService.adjustLimit(
      req.params.id,
      { ...req.body, adjustmentType: 'INCREASE' },
      actor
    );
    return ok(res, updated);
  })
);

/**
 * POST /api/v1/credit-facilities/:id/decrease
 */
creditFacilityRoutes.post(
  '/:id/decrease',
  asyncHandler(async (req: Request, res: Response) => {
    const actor = extractActor(req);
    const updated = creditLimitsService.adjustLimit(
      req.params.id,
      { ...req.body, adjustmentType: 'DECREASE' },
      actor
    );
    return ok(res, updated);
  })
);

/**
 * POST /api/v1/credit-facilities/:id/suspend
 */
creditFacilityRoutes.post(
  '/:id/suspend',
  asyncHandler(async (req: Request, res: Response) => {
    const actor = extractActor(req);
    const updated = creditLimitsService.suspendFacility(req.params.id, req.body.reason, actor);
    return ok(res, updated);
  })
);

/**
 * POST /api/v1/credit-facilities/:id/freeze
 */
creditFacilityRoutes.post(
  '/:id/freeze',
  asyncHandler(async (req: Request, res: Response) => {
    const actor = extractActor(req);
    const updated = creditLimitsService.freezeFacility(req.params.id, req.body.reason, actor);
    return ok(res, updated);
  })
);

/**
 * POST /api/v1/credit-facilities/:id/resume
 */
creditFacilityRoutes.post(
  '/:id/resume',
  asyncHandler(async (req: Request, res: Response) => {
    const actor = extractActor(req);
    const updated = creditLimitsService.resumeFacility(req.params.id, req.body.reason, actor);
    return ok(res, updated);
  })
);

/**
 * POST /api/v1/credit-facilities/:id/close
 */
creditFacilityRoutes.post(
  '/:id/close',
  asyncHandler(async (req: Request, res: Response) => {
    const actor = extractActor(req);
    const updated = creditLimitsService.closeFacility(req.params.id, req.body.reason, actor);
    return ok(res, updated);
  })
);

// =============================================================================
// 2. CREDIT LIMIT POLICIES ENDPOINTS
// =============================================================================

creditPolicyRoutes.use(authenticate);
creditPolicyRoutes.use(tenantContext);

/**
 * GET /api/v1/credit-policies
 */
creditPolicyRoutes.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const actor = extractActor(req);
    const tenantId = typeof req.query.tenantId === 'string' ? req.query.tenantId : req.tenantId;
    const policies = creditLimitsService.listPolicies(tenantId, actor);
    return ok(res, policies);
  })
);

/**
 * GET /api/v1/credit-policies/:id
 */
creditPolicyRoutes.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const actor = extractActor(req);
    const policy = creditLimitsService.getPolicy(req.params.id, actor);
    return ok(res, policy);
  })
);

/**
 * POST /api/v1/credit-policies
 */
creditPolicyRoutes.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const actor = extractActor(req);
    const policy = creditLimitsService.createPolicy(req.body, actor);
    return created(res, policy);
  })
);

// =============================================================================
// 3. DRAWDOWNS ENDPOINTS
// =============================================================================

drawdownRoutes.use(authenticate);
drawdownRoutes.use(tenantContext);

/**
 * GET /api/v1/drawdowns
 */
drawdownRoutes.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const actor = extractActor(req);
    const facilities = creditLimitsService.listFacilities({}, actor);
    const allDrawdowns = facilities.flatMap((f) => f.drawdowns || []);
    return ok(res, allDrawdowns);
  })
);
