import { Router } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { ForbiddenError } from '../../common/errors';
import { parsePagination } from '../../common/pagination';
import { success } from '../../common/response';
import { authenticate, authorize } from '../../middleware/auth';
import { tenantContext } from '../../middleware/tenant-context';
import { listLoans, getLoanDetail } from './loan.service';
import { loanServicingService } from './loan-servicing.service';

const router = Router();

router.use(authenticate);
router.use(tenantContext);

// 1. List Loans
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const params = parsePagination(req.query);
    const status = req.query.status ? String(req.query.status) : undefined;
    const branchId = req.query.branchId ? String(req.query.branchId) : undefined;
    const customerId = req.query.customerId ? String(req.query.customerId) : undefined;
    const isStaff = req.user?.roles.some((r) =>
      ['SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'LOAN_OFFICER', 'CREDIT_ANALYST', 'UNDERWRITER', 'BRANCH_MANAGER', 'AUDITOR', 'COLLECTION_OFFICER', 'FINANCE_OFFICER'].includes(r)
    );
    const userIdFilter = isStaff ? undefined : req.user?.id;
    const result = await listLoans(params, status, branchId, customerId, userIdFilter, req.user as any);
    res.json(success(result.data, result.pagination));
  })
);

// 2. Authoritative Loan Servicing Details
router.get(
  '/:id/servicing',
  asyncHandler(async (req, res) => {
    const servicingDetails = await loanServicingService.getLoanServicingDetails(
      req.params.id,
      {
        id: req.user!.id,
        email: req.user!.email,
        roles: req.user!.roles,
        tenantId: (req as any).tenantId || req.user?.tenantId,
        branchId: req.user?.branchId,
      }
    );
    const isStaff = req.user?.roles.some((r) =>
      ['SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'LOAN_OFFICER', 'CREDIT_ANALYST', 'UNDERWRITER', 'BRANCH_MANAGER', 'AUDITOR', 'COLLECTION_OFFICER', 'FINANCE_OFFICER'].includes(r)
    );
    if (!isStaff && servicingDetails.customerId !== req.user?.id) {
      // Check customer userId
      const loan = await getLoanDetail(req.params.id, req.user as any);
      if (loan.customer?.userId !== req.user?.id) {
        throw new ForbiddenError('Access forbidden: You cannot view another borrower loan account');
      }
    }
    res.json(success(servicingDetails));
  })
);

// 3. Recalculate DPD
router.post(
  '/:id/recalculate-dpd',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'FINANCE_OFFICER', 'COLLECTION_OFFICER', 'BRANCH_MANAGER'),
  asyncHandler(async (req, res) => {
    const result = await loanServicingService.evaluateLoanDpd(req.params.id);
    res.json(success(result));
  })
);

// 4. Gated Loan Closure
router.post(
  '/:id/close',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'FINANCE_OFFICER', 'BRANCH_MANAGER'),
  asyncHandler(async (req, res) => {
    const result = await loanServicingService.closeLoanAccount(
      req.params.id,
      req.body,
      {
        id: req.user!.id,
        email: req.user!.email,
        roles: req.user!.roles,
        tenantId: (req as any).tenantId || req.user?.tenantId,
        branchId: req.user?.branchId,
      }
    );
    res.json(success(result));
  })
);

// 5. Financial Adjustment / Waiver
router.post(
  '/:id/adjust',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'FINANCE_OFFICER'),
  asyncHandler(async (req, res) => {
    const result = await loanServicingService.postFinancialAdjustment(
      req.params.id,
      req.body,
      {
        id: req.user!.id,
        email: req.user!.email,
        roles: req.user!.roles,
        tenantId: (req as any).tenantId || req.user?.tenantId,
        branchId: req.user?.branchId,
      }
    );
    res.json(success(result));
  })
);

// 6. Generic Loan Detail
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const loan = await getLoanDetail(req.params.id, req.user as any);
    const isStaff = req.user?.roles.some((r) =>
      ['SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'LOAN_OFFICER', 'CREDIT_ANALYST', 'UNDERWRITER', 'BRANCH_MANAGER', 'AUDITOR', 'COLLECTION_OFFICER', 'FINANCE_OFFICER'].includes(r)
    );
    if (!isStaff && loan.customer?.userId !== req.user?.id) {
      throw new ForbiddenError('Access forbidden: You cannot view another borrower loan account');
    }
    res.json(success(loan));
  })
);

export default router;
