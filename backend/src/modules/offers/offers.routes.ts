import { Router, Request, Response } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { tenantContext } from '../../middleware/tenant-context';
import { offerEngineService } from './offers.service';
import { asyncHandler } from '../../common/asyncHandler';
import { ok, created } from '../../common/response';

export const offerRoutes = Router();

offerRoutes.use(authenticate);
offerRoutes.use(tenantContext);

// ---------------------------------------------------------------------------
// 1. OFFER SIMULATION (Stateless, available to staff and officers)
// ---------------------------------------------------------------------------

/**
 * POST /api/v1/offers/simulate
 * Simulates loan offer, EMI, fee breakdown, GST, APR, and repayment schedule preview.
 */
offerRoutes.post(
  '/simulate',
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId || 'tenant-adyapan-default';
    const simulation = offerEngineService.simulateOffer(tenantId, req.body);
    return ok(res, simulation);
  })
);

// ---------------------------------------------------------------------------
// 2. LOAN OFFER MANAGEMENT & QUERY ENDPOINTS
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/offers
 * Lists offers for the current tenant with optional status/search/customerId filtering.
 */
offerRoutes.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId || 'tenant-adyapan-default';
    const status = req.query.status as string | undefined;
    const search = req.query.search as string | undefined;
    const customerId = req.query.customerId as string | undefined;

    // If customer, only return their offers
    let targetCustomerId = customerId;
    if (req.user?.roles?.includes('CUSTOMER') && !req.user?.roles?.includes('ADMIN') && !req.user?.roles?.includes('SUPER_ADMIN')) {
      targetCustomerId = req.user.id;
    }

    const offers = offerEngineService.listOffers(tenantId, {
      status,
      search,
      customerId: targetCustomerId,
    });
    return ok(res, offers);
  })
);

/**
 * GET /api/v1/offers/:id
 * Retrieve single loan offer detail.
 */
offerRoutes.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId || 'tenant-adyapan-default';
    const offer = offerEngineService.getOfferById(tenantId, req.params.id);
    return ok(res, offer);
  })
);

/**
 * POST /api/v1/offers/:id/accept
 * Customer or assisted officer accepts active loan offer.
 */
offerRoutes.post(
  '/:id/accept',
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId || 'tenant-adyapan-default';
    const accepted = await offerEngineService.acceptOffer(
      tenantId,
      req.params.id,
      req.body,
      req.user as any
    );
    return ok(res, accepted);
  })
);

/**
 * POST /api/v1/offers/:id/decline
 * Customer declines active loan offer.
 */
offerRoutes.post(
  '/:id/decline',
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId || 'tenant-adyapan-default';
    const declined = await offerEngineService.declineOffer(
      tenantId,
      req.params.id,
      req.body,
      req.user as any
    );
    return ok(res, declined);
  })
);

/**
 * POST /api/v1/offers/:id/cancel
 * Operations/Underwriter cancels active loan offer.
 */
offerRoutes.post(
  '/:id/cancel',
  authorize('UNDERWRITER', 'BRANCH_MANAGER', 'CREDIT_HEAD', 'ADMIN', 'SUPER_ADMIN', 'COMPANY_ADMIN'),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId || 'tenant-adyapan-default';
    const cancelled = await offerEngineService.cancelOffer(
      tenantId,
      req.params.id,
      req.body?.reason,
      req.user as any
    );
    return ok(res, cancelled);
  })
);

// ---------------------------------------------------------------------------
// 3. APPLICATION-SCOPED OFFER GENERATION & HISTORY
// ---------------------------------------------------------------------------

/**
 * POST /api/v1/offers/generate and POST /api/v1/offers/applications/:applicationId/generate
 */
offerRoutes.post(
  '/generate',
  authorize('UNDERWRITER', 'LOAN_OFFICER', 'BRANCH_MANAGER', 'CREDIT_HEAD', 'ADMIN', 'SUPER_ADMIN', 'COMPANY_ADMIN'),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId || 'tenant-adyapan-default';
    const applicationId = req.body?.applicationId;
    const offer = await offerEngineService.generateOffer(
      tenantId,
      applicationId,
      req.body,
      req.user as any
    );
    return created(res, offer);
  })
);

offerRoutes.post(
  '/applications/:applicationId/generate',
  authorize('UNDERWRITER', 'LOAN_OFFICER', 'BRANCH_MANAGER', 'CREDIT_HEAD', 'ADMIN', 'SUPER_ADMIN', 'COMPANY_ADMIN'),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId || 'tenant-adyapan-default';
    const offer = await offerEngineService.generateOffer(
      tenantId,
      req.params.applicationId,
      req.body,
      req.user as any
    );
    return created(res, offer);
  })
);

/**
 * GET /api/v1/offers/application/:applicationId and GET /api/v1/offers/applications/:applicationId/offers
 */
offerRoutes.get(
  '/application/:applicationId',
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId || 'tenant-adyapan-default';
    const offers = offerEngineService.getApplicationOffers(tenantId, req.params.applicationId);
    return ok(res, offers);
  })
);

offerRoutes.get(
  '/applications/:applicationId/offers',
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId || 'tenant-adyapan-default';
    const offers = offerEngineService.getApplicationOffers(tenantId, req.params.applicationId);
    return ok(res, offers);
  })
);


// ---------------------------------------------------------------------------
// 4. PRICING POLICY MANAGEMENT ENDPOINTS
// ---------------------------------------------------------------------------

export const pricingPolicyRoutes = Router();

pricingPolicyRoutes.use(authenticate);
pricingPolicyRoutes.use(tenantContext);

pricingPolicyRoutes.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId || 'tenant-adyapan-default';
    const status = req.query.status as string | undefined;
    const search = req.query.search as string | undefined;
    const policies = offerEngineService.listPricingPolicies(tenantId, { status, search });
    return ok(res, policies);
  })
);

pricingPolicyRoutes.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId || 'tenant-adyapan-default';
    const policy = offerEngineService.getPricingPolicyById(tenantId, req.params.id);
    return ok(res, policy);
  })
);

pricingPolicyRoutes.post(
  '/',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN'),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId || 'tenant-adyapan-default';
    const policy = await offerEngineService.createPricingPolicy(
      tenantId,
      req.body,
      req.user as any
    );
    return created(res, policy);
  })
);

pricingPolicyRoutes.post(
  '/:id/versions',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN'),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId || 'tenant-adyapan-default';
    const version = await offerEngineService.createPolicyVersion(
      tenantId,
      req.params.id,
      req.user as any
    );
    return created(res, version);
  })
);

pricingPolicyRoutes.post(
  '/:id/activate',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN'),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId || 'tenant-adyapan-default';
    const activated = await offerEngineService.activatePricingPolicy(
      tenantId,
      req.params.id,
      req.user as any
    );
    return ok(res, activated);
  })
);
