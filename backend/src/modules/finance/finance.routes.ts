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

import { financeService } from './finance.service';
import { FinancialActorContext } from './financial-control.service';

const router = Router();

function getActor(req: Request): FinancialActorContext {
  const user = req.user;
  return {
    id: user?.id || 'sys-finance',
    email: user?.email || 'finance@adyapan.com',
    roles: user?.roles || ['FINANCE_OFFICER'],
    tenantId: user?.tenantId || req.tenant?.tenantId || 'tenant-adyapan-default',
    branchId: user?.branchId || req.branchId,
  };
}

const financeAuthorizedRoles = [
  'SUPER_ADMIN',
  'ADMIN',
  'COMPANY_ADMIN',
  'FINANCE_OFFICER',
  'FINANCE_CONTROLLER',
  'DISBURSEMENT_OFFICER',
] as const;

// --- FINANCE QUEUE & DISBURSEMENT OPERATIONS (M2P + mPokket Hybrid) ---

/**
 * GET /api/v1/finance/queue
 * List applications in Finance & Disbursement Queue by tab
 */
router.get(
  '/queue',
  authenticate,
  authorize(...financeAuthorizedRoles),
  asyncHandler(async (req: Request, res: Response) => {
    const tab = (req.query.tab as string) || 'READY_FOR_DISBURSEMENT';
    const search = req.query.search as string | undefined;
    const actor = getActor(req);

    const queue = await financeService.getFinanceQueue(tab, search, actor);
    return ok(res, queue);
  })
);

/**
 * GET /api/v1/finance/applications/:applicationId/workspace
 * 10 Contextual Sections for Financial Application Workspace
 */
router.get(
  '/applications/:applicationId/workspace',
  authenticate,
  authorize(...financeAuthorizedRoles),
  asyncHandler(async (req: Request, res: Response) => {
    const { applicationId } = req.params;
    const actor = getActor(req);

    const workspace = await financeService.getFinanceWorkspace(applicationId, actor);
    return ok(res, workspace);
  })
);

/**
 * POST /api/v1/finance/applications/:applicationId/maker-submit
 * Maker submits application for dual-control disbursement approval
 */
router.post(
  '/applications/:applicationId/maker-submit',
  authenticate,
  authorize(...financeAuthorizedRoles),
  asyncHandler(async (req: Request, res: Response) => {
    const { applicationId } = req.params;
    const { notes, reason } = req.body || {};
    const actor = getActor(req);

    const task = await financeService.proposeDisbursementTask(applicationId, { notes, reason }, actor);
    return created(res, task);
  })
);

/**
 * POST /api/v1/finance/tasks/:taskId/checker-approve
 * Checker approves or rejects the Maker's disbursement proposal (Maker != Checker enforced)
 */
router.post(
  '/tasks/:taskId/checker-approve',
  authenticate,
  authorize(...financeAuthorizedRoles),
  asyncHandler(async (req: Request, res: Response) => {
    const { taskId } = req.params;
    const { decision, comments } = req.body || {};
    const actor = getActor(req);

    const task = await financeService.approveDisbursementTask(
      taskId,
      { decision: decision || 'APPROVE', comments },
      actor
    );
    return ok(res, task);
  })
);

/**
 * POST /api/v1/finance/applications/:applicationId/execute
 * Execute disbursement through payment rail after 10-point gate checks & dual control
 */
router.post(
  '/applications/:applicationId/execute',
  authenticate,
  authorize(...financeAuthorizedRoles),
  asyncHandler(async (req: Request, res: Response) => {
    const { applicationId } = req.params;
    const { paymentRail, transactionReference, comments, disbursementMethod, referenceNumber, idempotencyKey } = req.body || {};
    const actor = getActor(req);

    const loan = await financeService.executeDisbursementWithControls(
      applicationId,
      {
        disbursementMethod: disbursementMethod || paymentRail || 'IMPS',
        referenceNumber: referenceNumber || transactionReference,
        idempotencyKey,
      },
      actor
    );
    return ok(res, loan);
  })
);

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
