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
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'FINANCE_OFFICER', 'DISBURSEMENT_OFFICER', 'BRANCH_MANAGER'),
  asyncHandler(async (req, res) => {
    const queue = await getReadyForDisbursementQueue({
      id: req.user?.id,
      roles: req.user?.roles,
      tenantId: (req as any).tenantId || req.user?.tenantId,
      branchId: req.user?.branchId,
    });
    res.json(success(queue));
  })
);

router.get(
  '/history',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'FINANCE_OFFICER', 'DISBURSEMENT_OFFICER', 'BRANCH_MANAGER', 'AUDITOR'),
  asyncHandler(async (req, res) => {
    const history = await getDisbursementHistory({
      id: req.user?.id,
      roles: req.user?.roles,
      tenantId: (req as any).tenantId || req.user?.tenantId,
      branchId: req.user?.branchId,
    });
    res.json(success(history));
  })
);

router.post(
  '/execute',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'FINANCE_OFFICER', 'DISBURSEMENT_OFFICER', 'BRANCH_MANAGER'),
  validate(executeDisbursementSchema),
  asyncHandler(async (req, res) => {
    const loan = await executeDisbursement(req.body, {
      id: req.user!.id,
      email: req.user!.email,
      roles: req.user!.roles,
      tenantId: (req as any).tenantId || req.user?.tenantId,
      branchId: req.user?.branchId,
    });
    res.status(201).json(success(loan));
  })
);

export default router;
