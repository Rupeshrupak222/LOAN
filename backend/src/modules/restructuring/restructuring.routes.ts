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
  authorize('CREDIT_ANALYST', 'UNDERWRITER', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN'),
  validate(proposeRestructureSchema),
  asyncHandler(async (req, res) => {
    const result = await restructureLoan(req.body, {
      id: req.user!.id,
      email: req.user!.email,
      roles: req.user!.roles,
      tenantId: (req as any).tenantId || req.user?.tenantId,
      branchId: req.user?.branchId,
    });
    res.status(201).json(success(result));
  })
);

router.post(
  '/settlement',
  authorize('SETTLEMENT_OFFICER', 'RECOVERY_HEAD', 'BRANCH_MANAGER', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN'),
  validate(proposeSettlementSchema),
  asyncHandler(async (req, res) => {
    const result = await executeSettlement(req.body, {
      id: req.user!.id,
      email: req.user!.email,
      roles: req.user!.roles,
      tenantId: (req as any).tenantId || req.user?.tenantId,
      branchId: req.user?.branchId,
    });
    res.status(201).json(success(result));
  })
);

router.post(
  '/closure',
  authorize('FINANCE_OFFICER', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN'),
  validate(executeClosureSchema),
  asyncHandler(async (req, res) => {
    const result = await closeLoanAndIssueNoc(req.body, {
      id: req.user!.id,
      email: req.user!.email,
      roles: req.user!.roles,
      tenantId: (req as any).tenantId || req.user?.tenantId,
      branchId: req.user?.branchId,
    });
    res.status(201).json(success(result));
  })
);

export default router;
