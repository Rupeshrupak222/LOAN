import { Router } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { success } from '../../common/response';
import { validate } from '../../middleware/validate';
import { authenticate, authorize } from '../../middleware/auth';
import {
  proposeRestructureSchema,
  proposeSettlementSchema,
  executeClosureSchema,
} from './restructuring.schema';
import {
  restructureLoan,
  executeSettlement,
  closeLoanAndIssueNoc,
} from './restructuring.service';

const router = Router();

router.use(authenticate);

router.post(
  '/restructure',
  authorize('SUPER_ADMIN', 'ADMIN', 'UNDERWRITER', 'BRANCH_MANAGER'),
  validate(proposeRestructureSchema),
  asyncHandler(async (req, res) => {
    const result = await restructureLoan(req.body, req.user as any);
    res.status(201).json(success(result));
  })
);

router.post(
  '/settlement',
  authorize('SUPER_ADMIN', 'ADMIN', 'FINANCE_OFFICER', 'BRANCH_MANAGER'),
  validate(proposeSettlementSchema),
  asyncHandler(async (req, res) => {
    const result = await executeSettlement(req.body, req.user as any);
    res.status(201).json(success(result));
  })
);

router.post(
  '/closure',
  authorize('SUPER_ADMIN', 'ADMIN', 'FINANCE_OFFICER', 'BRANCH_MANAGER'),
  validate(executeClosureSchema),
  asyncHandler(async (req, res) => {
    const result = await closeLoanAndIssueNoc(req.body, req.user as any);
    res.status(201).json(success(result));
  })
);

export default router;
