import { Router } from 'express';
import { prisma } from '../../config/prisma';
import { asyncHandler } from '../../common/asyncHandler';
import { BadRequestError, ForbiddenError } from '../../common/errors';
import { parsePagination } from '../../common/pagination';
import { success } from '../../common/response';
import { validate } from '../../middleware/validate';
import { authenticate, authorize } from '../../middleware/auth';
import { tenantContext } from '../../middleware/tenant-context';
import { recordPaymentSchema } from './payment.schema';
import { listPayments, listTransactions, getPaymentDetail, processPayment } from './payment.service';
import {
  createPaymentSubmission,
  listPaymentSubmissions,
  verifyPaymentSubmission,
  rejectPaymentSubmission,
} from './payment-submission.service';

const router = Router();

router.use(authenticate);
router.use(tenantContext);

/**
 * POST /payments/collect
 * Dedicated endpoint for Collection Officers to record borrower repayments.
 * Submits repayment collection for Finance verification & reconciliation.
 */
router.post(
  '/collect',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'COLLECTION_OFFICER'),
  asyncHandler(async (req, res) => {
    // Explicit SoD guard: Finance Officers are not authorized to perform customer repayment collection
    if (
      req.user?.roles?.includes('FINANCE_OFFICER') &&
      !req.user?.roles?.some((r: string) => ['SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN'].includes(r))
    ) {
      throw new ForbiddenError(
        'Access forbidden: Finance Officers are not authorized to collect repayments. Repayment collection must be performed by Collection Officers.'
      );
    }

    const { loanId, amount, method, reference, notes, payerMobile, paidAt } = req.body || {};
    if (!loanId) {
      throw new BadRequestError('Loan ID is required');
    }
    if (!amount || Number(amount) <= 0) {
      throw new BadRequestError('Valid collection amount is required');
    }
    if (!reference || !String(reference).trim()) {
      throw new BadRequestError('Transaction reference / UTR number is required');
    }

    const validMethods = ['UPI', 'NEFT', 'IMPS', 'CASH', 'CHEQUE', 'NET_BANKING', 'DEBIT_CARD', 'OTHER'];
    const chosenMethod = method && validMethods.includes(String(method).toUpperCase())
      ? String(method).toUpperCase()
      : 'UPI';

    const submissionNotes = notes
      ? `[Recorded by Collection Officer: ${req.user?.email}] ${notes}`
      : `[Recorded by Collection Officer: ${req.user?.email}]`;

    const submission = await createPaymentSubmission(
      {
        loanId,
        amount: Number(amount),
        method: chosenMethod,
        reference: String(reference).trim(),
        payerMobile,
        paidAt: paidAt ? new Date(paidAt) : new Date(),
        notes: submissionNotes,
      },
      {
        id: req.user!.id,
        roles: req.user!.roles,
        email: req.user!.email,
        tenantId: req.tenantId || req.user?.tenantId,
        branchId: req.user?.branchId,
      }
    );

    res.status(201).json(
      success({
        ...submission,
        message: 'Repayment collection recorded successfully. Awaiting Finance verification and reconciliation.',
      })
    );
  })
);

// Submissions Endpoints
router.post(
  '/submissions',
  asyncHandler(async (req, res) => {
    // Explicit guard: Finance Officers are not authorized to record collections
    if (
      req.user?.roles?.includes('FINANCE_OFFICER') &&
      !req.user?.roles?.some((r: string) => ['SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN'].includes(r))
    ) {
      throw new ForbiddenError(
        'Access forbidden: Finance Officers are not authorized to record customer repayment collections.'
      );
    }

    const submission = await createPaymentSubmission(req.body, {
      id: req.user!.id,
      roles: req.user!.roles,
      email: req.user!.email,
      tenantId: req.tenantId || req.user?.tenantId,
      branchId: req.user?.branchId,
    });
    res.status(201).json(success(submission));
  })
);

router.get(
  '/submissions',
  asyncHandler(async (req, res) => {
    const params = parsePagination(req.query);
    const status = req.query.status ? String(req.query.status) : undefined;
    const loanId = req.query.loanId ? String(req.query.loanId) : undefined;
    const customerId = req.query.customerId ? String(req.query.customerId) : undefined;
    const isStaff = req.user?.roles.some((r) =>
      ['SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'LOAN_OFFICER', 'CREDIT_ANALYST', 'UNDERWRITER', 'BRANCH_MANAGER', 'AUDITOR', 'COLLECTION_OFFICER', 'FINANCE_OFFICER'].includes(r)
    );
    const userIdFilter = isStaff ? undefined : req.user?.id;
    const result = await listPaymentSubmissions(params, status, loanId, customerId, userIdFilter, {
      id: req.user!.id,
      roles: req.user!.roles,
      email: req.user!.email,
      tenantId: req.tenantId || req.user?.tenantId,
      branchId: req.user?.branchId,
    });
    res.json(success(result.data, result.pagination));
  })
);

router.post(
  '/submissions/:id/verify',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'FINANCE_OFFICER', 'BRANCH_MANAGER'),
  asyncHandler(async (req, res) => {
    if (
      req.user?.roles?.includes('COLLECTION_OFFICER') &&
      !req.user?.roles?.some((r: string) => ['SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN'].includes(r))
    ) {
      throw new ForbiddenError(
        'Access forbidden: Collection Officers cannot perform financial verification or ledger reconciliation.'
      );
    }
    const result = await verifyPaymentSubmission(req.params.id, {
      id: req.user!.id,
      roles: req.user!.roles,
      email: req.user!.email,
      tenantId: req.tenantId || req.user?.tenantId,
      branchId: req.user?.branchId,
    });
    res.json(success(result));
  })
);

router.post(
  '/submissions/:id/reject',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'FINANCE_OFFICER', 'BRANCH_MANAGER'),
  asyncHandler(async (req, res) => {
    if (
      req.user?.roles?.includes('COLLECTION_OFFICER') &&
      !req.user?.roles?.some((r: string) => ['SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN'].includes(r))
    ) {
      throw new ForbiddenError(
        'Access forbidden: Collection Officers cannot perform exception handling or reject payment submissions.'
      );
    }
    const reason = req.body.reason ? String(req.body.reason) : 'Payment details could not be verified with banking records';
    const result = await rejectPaymentSubmission(req.params.id, reason, {
      id: req.user!.id,
      roles: req.user!.roles,
      email: req.user!.email,
      tenantId: req.tenantId || req.user?.tenantId,
      branchId: req.user?.branchId,
    });
    res.json(success(result));
  })
);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const params = parsePagination(req.query);
    const loanId = req.query.loanId ? String(req.query.loanId) : undefined;
    const customerId = req.query.customerId ? String(req.query.customerId) : undefined;
    const isStaff = req.user?.roles.some((r) =>
      ['SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'LOAN_OFFICER', 'CREDIT_ANALYST', 'UNDERWRITER', 'BRANCH_MANAGER', 'AUDITOR', 'COLLECTION_OFFICER', 'FINANCE_OFFICER'].includes(r)
    );
    const userIdFilter = isStaff ? undefined : req.user?.id;
    const result = await listPayments(params, loanId, customerId, userIdFilter, req.user as any);
    res.json(success(result.data, result.pagination));
  })
);

router.get(
  '/transactions',
  asyncHandler(async (req, res) => {
    const params = parsePagination(req.query);
    const type = req.query.type ? String(req.query.type) : undefined;
    const loanId = req.query.loanId ? String(req.query.loanId) : undefined;
    const result = await listTransactions(params, type, loanId, req.user as any);
    res.json(success(result.data, result.pagination));
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const payment = await getPaymentDetail(req.params.id, req.user as any);
    const isStaff = req.user?.roles.some((r) =>
      ['SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'LOAN_OFFICER', 'CREDIT_ANALYST', 'UNDERWRITER', 'BRANCH_MANAGER', 'AUDITOR', 'COLLECTION_OFFICER', 'FINANCE_OFFICER'].includes(r)
    );
    if (!isStaff && payment.customer?.userId !== req.user?.id) {
      throw new ForbiddenError('Access forbidden: You cannot view another borrower payment record');
    }
    res.json(success(payment));
  })
);

router.post(
  '/',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'FINANCE_OFFICER', 'BRANCH_MANAGER', 'CUSTOMER'),
  validate(recordPaymentSchema),
  asyncHandler(async (req, res) => {
    // Explicit SoD guard: Collection Officers cannot directly modify accounting ledger entries
    if (
      req.user?.roles?.includes('COLLECTION_OFFICER') &&
      !req.user?.roles?.some((r: string) => ['SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN'].includes(r))
    ) {
      throw new ForbiddenError(
        'Access forbidden: Collection Officers cannot directly modify accounting ledger entries. Repayments must be recorded and submitted for Finance verification and reconciliation.'
      );
    }

    const isStaff = req.user?.roles.some((r) =>
      ['SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'FINANCE_OFFICER', 'BRANCH_MANAGER'].includes(r)
    );
    if (!isStaff) {
      const targetLoan = await prisma.loan.findUnique({
        where: { id: req.body.loanId },
        include: { customer: true },
      });
      if (!targetLoan || targetLoan.customer?.userId !== req.user?.id) {
        throw new ForbiddenError('Access forbidden: You can only make payments on your own active loan account');
      }
    }
    const payment = await processPayment(req.body, req.user?.id, req.user as any);
    res.status(201).json(success(payment));
  })
);

export default router;
