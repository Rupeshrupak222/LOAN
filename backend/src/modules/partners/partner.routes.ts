import { Router } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { success } from '../../common/response';
import { authenticate } from '../../middleware/auth';
import { partnerService } from './partner.service';

const router = Router();

router.use(authenticate);

/**
 * POST /api/v1/partners
 * Registers a new DSA / LSP / Fintech partner entity.
 */
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const partner = await partnerService.registerPartner(req.body, {
      id: req.user!.id,
      email: req.user!.email,
      roles: req.user!.roles,
    });
    res.json(success(partner));
  })
);

/**
 * GET /api/v1/partners
 * Lists all registered partner entities.
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const partners = partnerService.listPartners({
      id: req.user!.id,
      roles: req.user!.roles,
    });
    res.json(success(partners));
  })
);

/**
 * POST /api/v1/partners/leads
 * Submits a new sourced lead with verified borrower consent.
 */
router.post(
  '/leads',
  asyncHandler(async (req, res) => {
    const lead = await partnerService.submitLead(req.body, {
      id: req.user!.id,
      email: req.user!.email,
      roles: req.user!.roles,
    });
    res.json(success(lead));
  })
);

/**
 * GET /api/v1/partners/leads
 * Lists sourced applications enforcing strict partner isolation.
 */
router.get(
  '/leads',
  asyncHandler(async (req, res) => {
    const { partnerId } = req.query;
    const leads = partnerService.listSourcedApplications(partnerId as string, {
      id: req.user!.id,
      email: req.user!.email,
      roles: req.user!.roles,
    });
    res.json(success(leads));
  })
);

/**
 * GET /api/v1/partners/leads/:id
 * Retrieves single sourced application with isolation check.
 */
router.get(
  '/leads/:id',
  asyncHandler(async (req, res) => {
    const lead = partnerService.getSourcedApplication(req.params.id, {
      id: req.user!.id,
      email: req.user!.email,
      roles: req.user!.roles,
    });
    res.json(success(lead));
  })
);

/**
 * POST /api/v1/partners/commissions/calculate-disbursement
 * Triggers commission calculation for a newly disbursed loan.
 */
router.post(
  '/commissions/calculate-disbursement',
  asyncHandler(async (req, res) => {
    const records = partnerService.calculateCommissionOnDisbursement(req.body);
    res.json(success(records));
  })
);

/**
 * GET /api/v1/partners/commissions
 * Lists commission and clawback records.
 */
router.get(
  '/commissions',
  asyncHandler(async (req, res) => {
    const { partnerId } = req.query;
    const records = partnerService.listCommissions(partnerId as string);
    res.json(success(records));
  })
);

/**
 * PATCH /api/v1/partners/:id/status
 * Updates partner governance status (ACTIVE, SUSPENDED, TERMINATED).
 */
router.patch(
  '/:id/status',
  asyncHandler(async (req, res) => {
    const { status } = req.body;
    const partner = await partnerService.updatePartnerStatus(req.params.id, status, {
      id: req.user!.id,
      email: req.user!.email,
      roles: req.user!.roles,
    });
    res.json(success(partner));
  })
);

/**
 * GET /api/v1/partners/:id/payout-summary
 * Fetches partner payout summary and net payable balances.
 */
router.get(
  '/:id/payout-summary',
  asyncHandler(async (req, res) => {
    const summary = partnerService.getPayoutSummary(req.params.id, {
      id: req.user!.id,
      roles: req.user!.roles,
    });
    res.json(success(summary));
  })
);

/**
 * POST /api/v1/partners/:id/payouts/batch
 * Processes a commission payout batch.
 */
router.post(
  '/:id/payouts/batch',
  asyncHandler(async (req, res) => {
    const result = await partnerService.processPayoutBatch(req.params.id, {
      id: req.user!.id,
      email: req.user!.email,
      roles: req.user!.roles,
    });
    res.json(success(result));
  })
);

/**
 * GET /api/v1/partners/:id
 * Retrieves a single partner profile. (Parameterized route placed after specific subroutes)
 */
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const partner = partnerService.getPartner(req.params.id, {
      id: req.user!.id,
      roles: req.user!.roles,
    });
    res.json(success(partner));
  })
);

export const partnerRoutes = router;
