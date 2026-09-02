import { Router } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { success } from '../../common/response';
import { validate } from '../../middleware/validate';
import { authenticate, authorize } from '../../middleware/auth';
import { executeDisbursementSchema } from './disbursement.schema';
import { getReadyForDisbursementQueue, getDisbursementHistory, executeDisbursement } from './disbursement.service';

const router = Router();

router.use(authenticate);

router.get(
  '/queue',
  authorize('SUPER_ADMIN', 'ADMIN', 'FINANCE_OFFICER', 'DISBURSEMENT_OFFICER', 'BRANCH_MANAGER', 'UNDERWRITER', 'CREDIT_ANALYST'),
  asyncHandler(async (_req, res) => {
    const queue = await getReadyForDisbursementQueue();
    res.json(success(queue));
  })
);

router.get(
  '/history',
  authorize('SUPER_ADMIN', 'ADMIN', 'FINANCE_OFFICER', 'DISBURSEMENT_OFFICER', 'BRANCH_MANAGER', 'UNDERWRITER', 'CREDIT_ANALYST', 'LOAN_OFFICER', 'AUDITOR'),
  asyncHandler(async (_req, res) => {
    const history = await getDisbursementHistory();
    res.json(success(history));
  })
);

router.post(
  '/execute',
  authorize('SUPER_ADMIN', 'ADMIN', 'FINANCE_OFFICER', 'DISBURSEMENT_OFFICER', 'BRANCH_MANAGER'),
  validate(executeDisbursementSchema),
  asyncHandler(async (req, res) => {
    const loan = await executeDisbursement(req.body, req.user as any);
    res.status(201).json(success(loan));
  })
);

export default router;
