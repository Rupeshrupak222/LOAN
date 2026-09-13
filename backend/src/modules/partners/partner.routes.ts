/**
 * Adyapan Lending OS — Phase 8: Partner, LSP & Embedded Lending REST API Routes
 */

import { Router, Request, Response } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { ok, created, success } from '../../common/response';
import { authenticate, authorize } from '../../middleware/auth';
import { tenantContext } from '../../middleware/tenant-context';
import { prisma } from '../../config/prisma';
import { NotFoundError, ForbiddenError } from '../../common/errors';
import {
  authenticatePartnerApi,
  requirePartnerScope,
  partnerIdempotency,
} from '../../middleware/partner-auth.middleware';
import { partnerService } from './partner.service';
import { partnerFortificationService } from './partner-fortification.service';

// -----------------------------------------------------------------------------
// 1. PARTNER ADMINISTRATION ROUTER (FOR LENDER ADMINS)
// -----------------------------------------------------------------------------
export const partnerRoutes = Router();

partnerRoutes.use(authenticate);
partnerRoutes.use(tenantContext);

/**
 * GET /api/v1/partners
 */
partnerRoutes.get(
  '/',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'BRANCH_MANAGER', 'AUDITOR', 'FINANCE_OFFICER'),
  asyncHandler(async (req: Request, res: Response) => {
    const { search, status, type } = req.query;
    const partners = partnerService.listPartners(
      {
        search: search as string,
        status: status as string,
        type: type as string,
        tenantId: req.tenantId,
      },
      { id: req.user?.id, roles: req.user?.roles, tenantId: req.tenantId }
    );
    return ok(res, partners);
  })
);

/**
 * POST /api/v1/partners
 */
partnerRoutes.post(
  '/',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN'),
  asyncHandler(async (req: Request, res: Response) => {
    const partner = await partnerService.registerPartner(req.body, {
      id: req.user?.id,
      email: req.user?.email,
      roles: req.user?.roles,
      tenantId: req.tenantId,
    });
    return created(res, partner);
  })
);

/**
 * GET /api/v1/partners/commissions
 */
partnerRoutes.get(
  '/commissions',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'FINANCE_OFFICER', 'BRANCH_MANAGER', 'AUDITOR'),
  asyncHandler(async (req: Request, res: Response) => {
    const { partnerId } = req.query;
    const records = partnerService.listCommissions(partnerId as string);
    return ok(res, records);
  })
);

/**
 * POST /api/v1/partners/commissions/calculate-disbursement
 */
partnerRoutes.post(
  '/commissions/calculate-disbursement',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'FINANCE_OFFICER', 'BRANCH_MANAGER'),
  asyncHandler(async (req: Request, res: Response) => {
    const record = partnerService.calculateCommissionOnDisbursement(req.body);
    return ok(res, record);
  })
);

/**
 * GET /api/v1/partners/:id
 */
partnerRoutes.get(
  '/:id',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'BRANCH_MANAGER', 'AUDITOR', 'FINANCE_OFFICER'),
  asyncHandler(async (req: Request, res: Response) => {
    const partner = partnerService.getPartner(req.params.id, {
      id: req.user?.id,
      roles: req.user?.roles,
      tenantId: req.tenantId,
    });
    return ok(res, partner);
  })
);

/**
 * PUT /api/v1/partners/:id
 */
partnerRoutes.put(
  '/:id',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN'),
  asyncHandler(async (req: Request, res: Response) => {
    const partner = await partnerService.updatePartner(req.params.id, req.body, {
      id: req.user?.id,
      email: req.user?.email,
      roles: req.user?.roles,
      tenantId: req.tenantId,
    });
    return ok(res, partner);
  })
);

/**
 * PATCH /api/v1/partners/:id/status
 */
partnerRoutes.patch(
  '/:id/status',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN'),
  asyncHandler(async (req: Request, res: Response) => {
    const { status } = req.body;
    const partner = await partnerService.updatePartnerStatus(req.params.id, status, {
      id: req.user?.id,
      email: req.user?.email,
      roles: req.user?.roles,
      tenantId: req.tenantId,
    });
    return ok(res, partner);
  })
);

/**
 * POST /api/v1/partners/:id/credentials
 */
partnerRoutes.post(
  '/:id/credentials',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN'),
  asyncHandler(async (req: Request, res: Response) => {
    const cred = partnerService.createApiCredential(req.params.id, req.body, {
      id: req.user?.id,
      email: req.user?.email,
      roles: req.user?.roles,
      tenantId: req.tenantId,
    });
    return created(res, cred);
  })
);

/**
 * GET /api/v1/partners/:id/credentials
 */
partnerRoutes.get(
  '/:id/credentials',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'AUDITOR'),
  asyncHandler(async (req: Request, res: Response) => {
    const creds = partnerService.listCredentials(req.params.id, {
      id: req.user?.id,
      roles: req.user?.roles,
      tenantId: req.tenantId,
    });
    return ok(res, creds);
  })
);

/**
 * POST /api/v1/partners/:id/credentials/:credId/rotate
 */
partnerRoutes.post(
  '/:id/credentials/:credId/rotate',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN'),
  asyncHandler(async (req: Request, res: Response) => {
    const cred = partnerService.rotateSecret(req.params.id, req.params.credId, {
      id: req.user?.id,
      email: req.user?.email,
      roles: req.user?.roles,
      tenantId: req.tenantId,
    });
    return ok(res, cred);
  })
);

/**
 * POST /api/v1/partners/:id/credentials/:credId/revoke
 */
partnerRoutes.post(
  '/:id/credentials/:credId/revoke',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN'),
  asyncHandler(async (req: Request, res: Response) => {
    const cred = partnerService.revokeCredential(req.params.id, req.params.credId, {
      id: req.user?.id,
      email: req.user?.email,
      roles: req.user?.roles,
      tenantId: req.tenantId,
    });
    return ok(res, cred);
  })
);

/**
 * POST /api/v1/partners/:id/webhooks
 */
partnerRoutes.post(
  '/:id/webhooks',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN'),
  asyncHandler(async (req: Request, res: Response) => {
    const sub = partnerService.registerWebhookSubscription(req.params.id, req.body, {
      id: req.user?.id,
      roles: req.user?.roles,
      tenantId: req.tenantId,
    });
    return created(res, sub);
  })
);

/**
 * GET /api/v1/partners/:id/webhooks
 */
partnerRoutes.get(
  '/:id/webhooks',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'AUDITOR'),
  asyncHandler(async (req: Request, res: Response) => {
    const subs = partnerService.listWebhookSubscriptions(req.params.id);
    return ok(res, subs);
  })
);

/**
 * GET /api/v1/partners/:id/payout-summary
 */
partnerRoutes.get(
  '/:id/payout-summary',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'FINANCE_OFFICER', 'BRANCH_MANAGER', 'AUDITOR'),
  asyncHandler(async (req: Request, res: Response) => {
    const summary = partnerService.getPayoutSummary(req.params.id);
    return ok(res, summary);
  })
);

/**
 * GET /api/v1/partners/:id/co-lending
 */
partnerRoutes.get(
  '/:id/co-lending',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'FINANCE_OFFICER', 'AUDITOR'),
  asyncHandler(async (req: Request, res: Response) => {
    const partner = partnerService.getPartner(req.params.id, {
      id: req.user?.id,
      roles: req.user?.roles,
      tenantId: req.tenantId,
    });
    const { loanAmount, nbfcSharePercentage } = req.query;
    const allocation = partnerFortificationService.calculateCoLendingAllocation(
      Number(loanAmount) || 1000000,
      Number(nbfcSharePercentage) || 80
    );
    return ok(res, { partnerId: partner.id, partnerName: partner.name, ...allocation });
  })
);

/**
 * POST /api/v1/partners/:id/payouts/batch
 */
partnerRoutes.post(
  '/:id/payouts/batch',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'FINANCE_OFFICER'),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await partnerService.processPayoutBatch(req.params.id, {
      id: req.user?.id,
      email: req.user?.email,
      roles: req.user?.roles,
    });
    return ok(res, result);
  })
);

// -----------------------------------------------------------------------------
// 2. PARTNER EMBEDDED API ROUTERS (MACHINE-TO-MACHINE & PARTNER PORTAL)
// -----------------------------------------------------------------------------

// --- /api/v1/partner-customers ---
export const partnerCustomerRoutes = Router();
partnerCustomerRoutes.use(authenticatePartnerApi);
partnerCustomerRoutes.use(partnerIdempotency);

partnerCustomerRoutes.post(
  '/',
  requirePartnerScope('partner.customer.create'),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await partnerService.registerPartnerCustomer(req.body, req.partnerContext!);
    const sanitized = partnerFortificationService.sanitizeCustomerForPartner(result, req.partnerContext!);
    return created(res, sanitized);
  })
);

partnerCustomerRoutes.get(
  '/:id',
  requirePartnerScope('partner.customer.read'),
  asyncHandler(async (req: Request, res: Response) => {
    const customer = await prisma.customer.findUnique({
      where: { id: req.params.id },
    });
    if (!customer) {
      throw new NotFoundError(`Customer with ID ${req.params.id} not found`);
    }
    if (customer.tenantId !== req.partnerContext!.tenantId) {
      throw new ForbiddenError('Access denied to cross-tenant customer record');
    }
    const sanitized = partnerFortificationService.sanitizeCustomerForPartner(customer, req.partnerContext!);
    return ok(res, sanitized);
  })
);

// --- /api/v1/partner-applications ---
export const partnerApplicationRoutes = Router();
partnerApplicationRoutes.use(authenticatePartnerApi);
partnerApplicationRoutes.use(partnerIdempotency);

partnerApplicationRoutes.post(
  '/',
  requirePartnerScope('partner.application.create'),
  asyncHandler(async (req: Request, res: Response) => {
    const mapping = await partnerService.createPartnerApplication(req.body, req.partnerContext!);
    const sanitized = partnerFortificationService.sanitizeApplicationForPartner(mapping, req.partnerContext!);
    return created(res, sanitized);
  })
);

partnerApplicationRoutes.get(
  '/',
  requirePartnerScope('partner.application.read'),
  asyncHandler(async (req: Request, res: Response) => {
    const list = partnerService.listPartnerApplications(req.partnerContext!);
    const sanitized = list.map((item) => partnerFortificationService.sanitizeApplicationForPartner(item, req.partnerContext!));
    return ok(res, sanitized);
  })
);

partnerApplicationRoutes.get(
  '/:id',
  requirePartnerScope('partner.application.read'),
  asyncHandler(async (req: Request, res: Response) => {
    const mapping = partnerService.getPartnerApplicationMapping(req.params.id, req.partnerContext!);
    const sanitized = partnerFortificationService.sanitizeApplicationForPartner(mapping, req.partnerContext!);
    return ok(res, sanitized);
  })
);

partnerApplicationRoutes.patch(
  '/:id',
  requirePartnerScope('partner.application.update'),
  asyncHandler(async (req: Request, res: Response) => {
    const mapping = await partnerService.updatePartnerApplication(req.params.id, req.body, req.partnerContext!);
    const sanitized = partnerFortificationService.sanitizeApplicationForPartner(mapping, req.partnerContext!);
    return ok(res, sanitized);
  })
);

partnerApplicationRoutes.post(
  '/:id/submit',
  requirePartnerScope('partner.application.submit'),
  asyncHandler(async (req: Request, res: Response) => {
    const mapping = partnerService.getPartnerApplicationMapping(req.params.id, req.partnerContext!);
    partnerFortificationService.validatePartnerAllowedStageTransition(mapping.currentStage || 'DRAFT', 'SUBMIT_APPLICATION');
    const result = await partnerService.submitPartnerApplication(req.params.id, req.partnerContext!);
    const sanitized = partnerFortificationService.sanitizeApplicationForPartner(result, req.partnerContext!);
    return ok(res, sanitized);
  })
);

partnerApplicationRoutes.get(
  '/:id/documents',
  requirePartnerScope('partner.document.read'),
  asyncHandler(async (req: Request, res: Response) => {
    const mapping = partnerService.getPartnerApplicationMapping(req.params.id, req.partnerContext!);
    const docs = await prisma.document.findMany({
      where: {
        applicationId: mapping.adyapanApplicationId,
      },
      select: {
        id: true,
        category: true,
        documentType: true,
        status: true,
        fileName: true,
        createdAt: true,
      },
    });
    return ok(res, docs);
  })
);

partnerApplicationRoutes.post(
  '/:id/documents',
  requirePartnerScope('partner.document.upload'),
  asyncHandler(async (req: Request, res: Response) => {
    const mapping = partnerService.getPartnerApplicationMapping(req.params.id, req.partnerContext!);
    partnerFortificationService.validatePartnerAllowedStageTransition(mapping.currentStage || 'DRAFT', 'UPLOAD_DOCUMENT');
    const { type, fileName, fileUrl } = req.body;
    const doc = await prisma.document.create({
      data: {
        category: type || 'PARTNER_ATTACHMENT',
        documentType: type || 'PARTNER_DOCUMENT',
        fileName: fileName || 'document.pdf',
        storageKey: fileUrl || 'https://storage.adyapan.internal/partner-docs/temp',
        status: 'PENDING',
        applicationId: mapping.adyapanApplicationId,
      },
      select: {
        id: true,
        category: true,
        documentType: true,
        status: true,
        fileName: true,
        createdAt: true,
      },
    });
    return created(res, doc);
  })
);

// --- /api/v1/partner-offers ---
export const partnerOfferRoutes = Router();
partnerOfferRoutes.use(authenticatePartnerApi);
partnerOfferRoutes.use(partnerIdempotency);

partnerOfferRoutes.get(
  '/:partnerApplicationId',
  requirePartnerScope('partner.offer.read'),
  asyncHandler(async (req: Request, res: Response) => {
    const offer = await partnerService.getPartnerOffer(req.params.partnerApplicationId, req.partnerContext!);
    const sanitized = partnerFortificationService.sanitizeOfferForPartner(offer, req.params.partnerApplicationId);
    return ok(res, sanitized);
  })
);

partnerOfferRoutes.post(
  '/:offerId/accept',
  requirePartnerScope('partner.offer.accept'),
  asyncHandler(async (req: Request, res: Response) => {
    const { kfsAccepted, termsAccepted } = req.body;
    const isAcknowledged = Boolean(kfsAccepted && termsAccepted);
    const offer = await partnerService.acceptPartnerOffer(req.params.offerId, isAcknowledged, req.partnerContext!);
    const sanitized = partnerFortificationService.sanitizeOfferForPartner(offer, offer.partnerApplicationId || req.params.offerId);
    return ok(res, sanitized);
  })
);

// --- /api/v1/partner-credit-lines ---
export const partnerCreditLineRoutes = Router();
partnerCreditLineRoutes.use(authenticatePartnerApi);
partnerCreditLineRoutes.use(partnerIdempotency);

partnerCreditLineRoutes.get(
  '/customer/:customerId',
  requirePartnerScope('partner.credit_limit.read'),
  asyncHandler(async (req: Request, res: Response) => {
    const facility = partnerService.getPartnerCreditFacility(req.params.customerId, req.partnerContext!);
    return ok(res, facility);
  })
);

partnerCreditLineRoutes.post(
  '/:facilityId/drawdowns',
  requirePartnerScope('partner.drawdown.create'),
  asyncHandler(async (req: Request, res: Response) => {
    const drawdown = await partnerService.requestPartnerDrawdown(req.params.facilityId, req.body, req.partnerContext!);
    return created(res, drawdown);
  })
);

// --- /api/v1/partner-webhooks ---
export const partnerWebhookRoutes = Router();
partnerWebhookRoutes.use(authenticatePartnerApi);

partnerWebhookRoutes.get(
  '/subscriptions',
  requirePartnerScope('partner.webhook.manage'),
  asyncHandler(async (req: Request, res: Response) => {
    const subs = partnerService.listWebhookSubscriptions(req.partnerContext!.partnerId);
    return ok(res, subs);
  })
);

partnerWebhookRoutes.post(
  '/subscriptions',
  requirePartnerScope('partner.webhook.manage'),
  asyncHandler(async (req: Request, res: Response) => {
    const sub = partnerService.registerWebhookSubscription(req.partnerContext!.partnerId, req.body);
    return created(res, sub);
  })
);

partnerWebhookRoutes.get(
  '/deliveries',
  requirePartnerScope('partner.webhook.manage'),
  asyncHandler(async (req: Request, res: Response) => {
    const deliveries = partnerService.listWebhookDeliveries(req.partnerContext!.partnerId);
    return ok(res, deliveries);
  })
);

partnerWebhookRoutes.post(
  '/replay/:deliveryId',
  requirePartnerScope('partner.webhook.manage'),
  asyncHandler(async (req: Request, res: Response) => {
    const delivery = await partnerService.replayWebhookDelivery(req.params.deliveryId, req.partnerContext!);
    return ok(res, delivery);
  })
);

partnerWebhookRoutes.post(
  '/test-ping',
  requirePartnerScope('partner.webhook.manage'),
  asyncHandler(async (req: Request, res: Response) => {
    const deliveries = await partnerService.dispatchWebhook(
      req.partnerContext!.partnerId,
      'test.ping',
      { ping: true, message: 'Test webhook event from Adyapan Lending OS', timestamp: Date.now() },
      req.partnerContext!.environment
    );
    return ok(res, { dispatchedCount: deliveries.length, deliveries });
  })
);

// --- /api/v1/partner-reports ---
export const partnerReportRoutes = Router();
partnerReportRoutes.use(authenticatePartnerApi);

partnerReportRoutes.get(
  '/summary',
  requirePartnerScope('partner.reporting.read'),
  asyncHandler(async (req: Request, res: Response) => {
    const apps = partnerService.listPartnerApplications(req.partnerContext!);
    const payout = partnerService.getPayoutSummary(req.partnerContext!.partnerId);
    return ok(res, {
      totalApplications: apps.length,
      submittedCount: apps.filter((a) => a.status === 'SUBMITTED').length,
      disbursedCount: apps.filter((a) => a.status === 'DISBURSED').length,
      totalDisbursedVolume: payout.totalDisbursedVolume,
      earnedCommissions: payout.totalEarnedCommission,
      pendingPayouts: payout.pendingPayoutAmount,
    });
  })
);
