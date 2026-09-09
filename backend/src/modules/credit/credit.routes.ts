import { Router } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { success } from '../../common/response';
import { validate } from '../../middleware/validate';
import { authenticate, authorize } from '../../middleware/auth';
import {
  submitCreditDecisionSchema,
  verifyFinancialsSchema,
} from './credit.schema';
import {
  getFinancialCapacity,
  submitCreditDecision,
  verifyFinancials,
  getCreditQueue,
} from './credit.service';

const router = Router();

router.use(authenticate);

/**
 * GET /api/v1/credit/queue
 * Returns Credit Assessment Queue with live Credit Analyst metrics.
 */
router.get(
  '/queue',
  authorize('SUPER_ADMIN', 'ADMIN', 'CREDIT_ANALYST'),
  asyncHandler(async (req, res) => {
    const queue = await getCreditQueue((req.query as any)?.tab);
    res.json(success(queue));
  })
);

/**
 * GET /api/v1/credit/applications/:id/capacity
 * Returns full financial repayment capacity, DTI, FOIR, disposable income, and bureau score.
 */
router.get(
  '/applications/:id/capacity',
  authorize(
    'SUPER_ADMIN',
    'ADMIN',
    'CREDIT_ANALYST',
    'UNDERWRITER',
    'BRANCH_MANAGER',
    'AUDITOR'
  ),
  asyncHandler(async (req, res) => {
    const data = await getFinancialCapacity(req.params.id);
    res.json(success(data));
  })
);

/**
 * POST /api/v1/credit/applications/:id/decision
 * Submits official credit assessment decision (ELIGIBLE, NOT_ELIGIBLE, FURTHER_REVIEW).
 */
router.post(
  '/applications/:id/decision',
  authorize('SUPER_ADMIN', 'ADMIN', 'CREDIT_ANALYST'),
  validate(submitCreditDecisionSchema),
  asyncHandler(async (req, res) => {
    const result = await submitCreditDecision(
      req.params.id,
      req.body,
      req.user as any
    );
    res.json(success(result));
  })
);

/**
 * POST /api/v1/credit/applications/:id/verify-financials
 * Verifies income and employment details.
 */
router.post(
  '/applications/:id/verify-financials',
  authorize('SUPER_ADMIN', 'ADMIN', 'CREDIT_ANALYST'),
  validate(verifyFinancialsSchema),
  asyncHandler(async (req, res) => {
    const result = await verifyFinancials(
      req.params.id,
      req.body,
      req.user as any
    );
    res.json(success(result));
  })
);

export default router;
