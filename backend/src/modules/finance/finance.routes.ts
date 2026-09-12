import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../common/asyncHandler';
import { ok, created } from '../../common/response';
import { validate } from '../../middleware/validate';
import { calculateEmi } from './emi';
import { authenticate, authorize } from '../../middleware/auth';
import { generalLedgerService } from './gl.service';
import { dailyAccrualService } from './accrual.service';
import { npaClassificationService } from './npa.service';

const router = Router();

const emiSchema = z.object({
  principal: z.coerce.number().positive(),
  interestRate: z.coerce.number().nonnegative(),
  tenureMonths: z.coerce.number().int().positive().max(600),
});

// Public EMI calculator - no auth required.
router.post(
  '/emi',
  validate({ body: emiSchema }),
  asyncHandler(async (req, res) => {
    const { principal, interestRate, tenureMonths } = req.body;
    return ok(res, calculateEmi(principal, interestRate, tenureMonths));
  }),
);

// --- GENERAL LEDGER (GL) & FINANCIAL REPORTING (Authenticated) ---

/**
 * GET /api/v1/finance/gl/chart-of-accounts
 */
router.get(
  '/gl/chart-of-accounts',
  authenticate,
  asyncHandler(async (req, res) => {
    const coa = generalLedgerService.getChartOfAccounts();
    return ok(res, coa);
  })
);

/**
 * GET /api/v1/finance/gl/trial-balance
 */
router.get(
  '/gl/trial-balance',
  authenticate,
  asyncHandler(async (req, res) => {
    const tenantId = req.user?.tenantId;
    const tb = generalLedgerService.getTrialBalance(tenantId);
    return ok(res, tb);
  })
);

/**
 * GET /api/v1/finance/gl/journal-entries
 */
router.get(
  '/gl/journal-entries',
  authenticate,
  asyncHandler(async (req, res) => {
    const tenantId = req.user?.tenantId;
    const refType = req.query.referenceType as any;
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const entries = generalLedgerService.listJournalEntries({ tenantId, referenceType: refType, limit });
    return ok(res, entries);
  })
);

/**
 * POST /api/v1/finance/gl/journal-entries
 * Post manual journal entry (Requires FINANCE_OFFICER, ADMIN, SUPER_ADMIN)
 */
router.post(
  '/gl/journal-entries',
  authenticate,
  authorize('SUPER_ADMIN', 'ADMIN', 'COMPANY_ADMIN', 'FINANCE_OFFICER', 'FINANCE_CONTROLLER'),
  asyncHandler(async (req, res) => {
    const user = req.user;
    const entry = await generalLedgerService.createJournalEntry({
      ...req.body,
      tenantId: user?.tenantId,
      postedBy: user?.email || user?.id,
    });
    return created(res, entry);
  })
);

/**
 * POST /api/v1/finance/accruals/run-eod
 * Trigger End-Of-Day interest accrual calculation and GL posting
 */
router.post(
  '/accruals/run-eod',
  authenticate,
  authorize('SUPER_ADMIN', 'ADMIN', 'COMPANY_ADMIN', 'FINANCE_OFFICER', 'FINANCE_CONTROLLER'),
  asyncHandler(async (req, res) => {
    const tenantId = req.user?.tenantId;
    const { runDate } = req.body || {};
    const result = await dailyAccrualService.runEodAccrual(tenantId, runDate);
    return ok(res, result);
  })
);

/**
 * GET /api/v1/finance/npa/portfolio-summary
 * Get RBI-compliant NPA portfolio quality metrics
 */
router.get(
  '/npa/portfolio-summary',
  authenticate,
  asyncHandler(async (req, res) => {
    const tenantId = req.user?.tenantId;
    const { summary } = await npaClassificationService.getPortfolioNpaSummary(tenantId);
    return ok(res, summary);
  })
);

/**
 * GET /api/v1/finance/npa/classifications
 * List individual loan NPA asset classifications
 */
router.get(
  '/npa/classifications',
  authenticate,
  asyncHandler(async (req, res) => {
    const tenantId = req.user?.tenantId;
    const { loanClassifications } = await npaClassificationService.getPortfolioNpaSummary(tenantId);
    return ok(res, loanClassifications);
  })
);

export default router;
