import { Router } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { ForbiddenError } from '../../common/errors';
import { parsePagination } from '../../common/pagination';
import { success } from '../../common/response';
import { authenticate } from '../../middleware/auth';
import { listLoans, getLoanDetail } from './loan.service';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const params = parsePagination(req.query);
    const status = req.query.status ? String(req.query.status) : undefined;
    const branchId = req.query.branchId ? String(req.query.branchId) : undefined;
    const customerId = req.query.customerId ? String(req.query.customerId) : undefined;
    const isStaff = req.user?.roles.some((r) =>
      ['SUPER_ADMIN', 'ADMIN', 'LOAN_OFFICER', 'CREDIT_ANALYST', 'UNDERWRITER', 'BRANCH_MANAGER', 'AUDITOR', 'COLLECTION_OFFICER', 'FINANCE_OFFICER'].includes(r)
    );
    const userIdFilter = isStaff ? undefined : req.user?.id;
    const result = await listLoans(params, status, branchId, customerId, userIdFilter);
    res.json(success(result.data, result.pagination));
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const loan = await getLoanDetail(req.params.id);
    const isStaff = req.user?.roles.some((r) =>
      ['SUPER_ADMIN', 'ADMIN', 'LOAN_OFFICER', 'CREDIT_ANALYST', 'UNDERWRITER', 'BRANCH_MANAGER', 'AUDITOR', 'COLLECTION_OFFICER', 'FINANCE_OFFICER'].includes(r)
    );
    if (!isStaff && loan.customer?.userId !== req.user?.id) {
      throw new ForbiddenError('Access forbidden: You cannot view another borrower loan account');
    }
    res.json(success(loan));
  })
);

export default router;
