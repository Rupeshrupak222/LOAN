import { Router } from 'express';
import { prisma } from '../../config/prisma';
import { asyncHandler } from '../../common/asyncHandler';
import { ForbiddenError } from '../../common/errors';
import { parsePagination } from '../../common/pagination';
import { success } from '../../common/response';
import { validate } from '../../middleware/validate';
import { authenticate, authorize } from '../../middleware/auth';
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

// Submissions Endpoints
router.post(
  '/submissions',
  asyncHandler(async (req, res) => {
    const submission = await createPaymentSubmission(req.body, {
      id: req.user!.id,
      roles: req.user!.roles,
      email: req.user!.email,
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
      ['SUPER_ADMIN', 'ADMIN', 'LOAN_OFFICER', 'CREDIT_ANALYST', 'UNDERWRITER', 'BRANCH_MANAGER', 'AUDITOR', 'COLLECTION_OFFICER', 'FINANCE_OFFICER'].includes(r)
    );
    const userIdFilter = isStaff ? undefined : req.user?.id;
    const result = await listPaymentSubmissions(params, status, loanId, customerId, userIdFilter);
    res.json(success(result.data, result.pagination));
  })
);

router.post(
  '/submissions/:id/verify',
  authorize('SUPER_ADMIN', 'ADMIN', 'FINANCE_OFFICER', 'COLLECTION_OFFICER', 'BRANCH_MANAGER'),
  asyncHandler(async (req, res) => {
    const result = await verifyPaymentSubmission(req.params.id, {
      id: req.user!.id,
      roles: req.user!.roles,
      email: req.user!.email,
    });
    res.json(success(result));
  })
);

router.post(
  '/submissions/:id/reject',
  authorize('SUPER_ADMIN', 'ADMIN', 'FINANCE_OFFICER', 'COLLECTION_OFFICER', 'BRANCH_MANAGER', 'LOAN_OFFICER', 'CREDIT_ANALYST'),
  asyncHandler(async (req, res) => {
    const reason = req.body.reason ? String(req.body.reason) : 'Payment details could not be verified with banking records';
    const result = await rejectPaymentSubmission(req.params.id, reason, {
      id: req.user!.id,
      roles: req.user!.roles,
      email: req.user!.email,
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
      ['SUPER_ADMIN', 'ADMIN', 'LOAN_OFFICER', 'CREDIT_ANALYST', 'UNDERWRITER', 'BRANCH_MANAGER', 'AUDITOR', 'COLLECTION_OFFICER', 'FINANCE_OFFICER'].includes(r)
    );
    const userIdFilter = isStaff ? undefined : req.user?.id;
    const result = await listPayments(params, loanId, customerId, userIdFilter);
    res.json(success(result.data, result.pagination));
  })
);

router.get(
  '/transactions',
  asyncHandler(async (req, res) => {
    const params = parsePagination(req.query);
    const type = req.query.type ? String(req.query.type) : undefined;
    const loanId = req.query.loanId ? String(req.query.loanId) : undefined;
    const result = await listTransactions(params, type, loanId);
    res.json(success(result.data, result.pagination));
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const payment = await getPaymentDetail(req.params.id);
    const isStaff = req.user?.roles.some((r) =>
      ['SUPER_ADMIN', 'ADMIN', 'LOAN_OFFICER', 'CREDIT_ANALYST', 'UNDERWRITER', 'BRANCH_MANAGER', 'AUDITOR', 'COLLECTION_OFFICER', 'FINANCE_OFFICER'].includes(r)
    );
    if (!isStaff && payment.customer?.userId !== req.user?.id) {
      throw new ForbiddenError('Access forbidden: You cannot view another borrower payment record');
    }
    res.json(success(payment));
  })
);

router.post(
  '/',
  authorize('SUPER_ADMIN', 'ADMIN', 'FINANCE_OFFICER', 'COLLECTION_OFFICER', 'LOAN_OFFICER', 'BRANCH_MANAGER', 'CUSTOMER'),
  validate(recordPaymentSchema),
  asyncHandler(async (req, res) => {
    const isStaff = req.user?.roles.some((r) =>
      ['SUPER_ADMIN', 'ADMIN', 'LOAN_OFFICER', 'CREDIT_ANALYST', 'UNDERWRITER', 'BRANCH_MANAGER', 'AUDITOR', 'COLLECTION_OFFICER', 'FINANCE_OFFICER'].includes(r)
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
    const payment = await processPayment(req.body, req.user?.id);
    res.status(201).json(success(payment));
  })
);

export default router;
