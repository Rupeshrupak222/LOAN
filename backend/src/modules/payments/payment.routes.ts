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
import {
  listPayments,
  listTransactions,
  getPaymentDetail,
  processPayment,
  initiatePayment,
  confirmPayment,
  processRefund,
  reversePayment,
  initiatePayout,
  listPayouts,
  getPayoutDetail,
  getCustomerSafePayment,
  getPartnerSafePayment,
} from './payment.service';
import {
  createPaymentSubmission,
  listPaymentSubmissions,
  verifyPaymentSubmission,
  rejectPaymentSubmission,
} from './payment-submission.service';
import { paymentWebhookService } from './payment-webhook.service';
import { paymentDisputeService } from './payment-dispute.service';

const router = Router();

/**
 * PUBLIC / SIGNATURE-AUTHENTICATED WEBHOOK INGESTION
 * POST /payments/webhook
 */
router.post(
  '/webhook',
  asyncHandler(async (req, res) => {
    const signature = (req.headers['x-razorpay-signature'] ||
      req.headers['x-webhook-signature'] ||
      req.headers['x-signature'] ||
      '') as string;

    const result = await paymentWebhookService.ingestWebhook({
      eventType: req.body?.event || req.body?.type || 'payment.captured',
      provider: (req.headers['x-provider'] as string) || 'SANDBOX',
      signature,
      payload: req.body || {},
    });

    res.json(success(result));
  })
);

router.use(authenticate);
router.use(tenantContext);

/**
 * GET /payments/webhook/events
 * List ingested webhook event audit log
 */
router.get(
  '/webhook/events',
  authorize('SUPER_ADMIN', 'FINANCE_OFFICER', 'ADMIN', 'AUDITOR'),
  asyncHandler(async (_req, res) => {
    const events = paymentWebhookService.listWebhookEvents();
    res.json(success(events));
  })
);

/**
 * POST /payments/initiate
 * Initiate digital checkout or payment intent
 */
router.post(
  '/initiate',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'FINANCE_OFFICER', 'CUSTOMER', 'LOAN_OFFICER'),
  asyncHandler(async (req, res) => {
    const result = await initiatePayment(req.body, {
      id: req.user!.id,
      email: req.user!.email,
      roles: req.user!.roles,
      tenantId: (req as any).tenantId || req.user?.tenantId,
      branchId: req.user?.branchId,
    });
    res.status(201).json(success(result));
  })
);

/**
 * POST /payments/:id/confirm
 * Confirm gateway payment or record direct banking settlement
 */
router.post(
  '/:id/confirm',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'FINANCE_OFFICER'),
  asyncHandler(async (req, res) => {
    const result = await confirmPayment(req.params.id, req.body || {}, {
      id: req.user!.id,
      email: req.user!.email,
      roles: req.user!.roles,
      tenantId: (req as any).tenantId || req.user?.tenantId,
      branchId: req.user?.branchId,
    });
    res.json(success(result));
  })
);

/**
 * POST /payments/:id/refund
 * Process payment refund with Double-Entry General Ledger journal
 */
router.post(
  '/:id/refund',
  authorize('SUPER_ADMIN', 'FINANCE_OFFICER'),
  asyncHandler(async (req, res) => {
    const refund = await processRefund(req.params.id, req.body || {}, {
      id: req.user!.id,
      email: req.user!.email,
      roles: req.user!.roles,
      tenantId: (req as any).tenantId || req.user?.tenantId,
      branchId: req.user?.branchId,
    });
    res.status(201).json(success(refund));
  })
);

/**
 * POST /payments/:id/reverse
 * Execute payment reversal / bounce rollback with compensating GL journal
 */
router.post(
  '/:id/reverse',
  authorize('SUPER_ADMIN', 'FINANCE_OFFICER'),
  asyncHandler(async (req, res) => {
    const reversal = await reversePayment(req.params.id, req.body || {}, {
      id: req.user!.id,
      email: req.user!.email,
      roles: req.user!.roles,
      tenantId: (req as any).tenantId || req.user?.tenantId,
      branchId: req.user?.branchId,
    });
    res.status(201).json(success(reversal));
  })
);

/**
 * SAFE VIEWS (Borrower & Partner Portals)
 */
router.get(
  '/:id/customer-safe',
  asyncHandler(async (req, res) => {
    const summary = await getCustomerSafePayment(req.params.id, {
      id: req.user!.id,
      email: req.user!.email,
      roles: req.user!.roles,
      tenantId: (req as any).tenantId || req.user?.tenantId,
      branchId: req.user?.branchId,
    });
    res.json(success(summary));
  })
);

router.get(
  '/:id/partner-safe',
  asyncHandler(async (req, res) => {
    const summary = await getPartnerSafePayment(req.params.id, {
      id: req.user!.id,
      email: req.user!.email,
      roles: req.user!.roles,
      tenantId: (req as any).tenantId || req.user?.tenantId,
      branchId: req.user?.branchId,
    });
    res.json(success(summary));
  })
);

/**
 * PAYOUTS & DISBURSEMENTS DESK
 */
router.post(
  '/payouts/initiate',
  authorize('SUPER_ADMIN', 'FINANCE_OFFICER', 'DISBURSEMENT_OFFICER', 'ADMIN'),
  asyncHandler(async (req, res) => {
    const payout = await initiatePayout(req.body || {}, {
      id: req.user!.id,
      email: req.user!.email,
      roles: req.user!.roles,
      tenantId: (req as any).tenantId || req.user?.tenantId,
      branchId: req.user?.branchId,
    });
    res.status(201).json(success(payout));
  })
);

router.get(
  '/payouts',
  authorize('SUPER_ADMIN', 'FINANCE_OFFICER', 'DISBURSEMENT_OFFICER', 'ADMIN', 'AUDITOR'),
  asyncHandler(async (req, res) => {
    const { loanId, status } = req.query;
    const payouts = listPayouts({
      tenantId: (req as any).tenantId || req.user?.tenantId,
      loanId: loanId as string,
      status: status as string,
    });
    res.json(success(payouts));
  })
);

router.get(
  '/payouts/:id',
  authorize('SUPER_ADMIN', 'FINANCE_OFFICER', 'DISBURSEMENT_OFFICER', 'ADMIN', 'AUDITOR'),
  asyncHandler(async (req, res) => {
    const payout = getPayoutDetail(req.params.id);
    res.json(success(payout));
  })
);

/**
 * DISPUTES & CHARGEBACKS
 */
router.post(
  '/disputes',
  authorize('SUPER_ADMIN', 'FINANCE_OFFICER', 'ADMIN'),
  asyncHandler(async (req, res) => {
    const dispute = await paymentDisputeService.createDispute(req.body, {
      id: req.user!.id,
      email: req.user!.email,
      roles: req.user!.roles,
      tenantId: (req as any).tenantId || req.user?.tenantId,
    });
    res.status(201).json(success(dispute));
  })
);

router.get(
  '/disputes',
  authorize('SUPER_ADMIN', 'FINANCE_OFFICER', 'ADMIN', 'AUDITOR'),
  asyncHandler(async (req, res) => {
    const { paymentId, status, type } = req.query;
    const disputes = paymentDisputeService.listDisputes({
      tenantId: (req as any).tenantId || req.user?.tenantId,
      paymentId: paymentId as string,
      status: status as any,
      type: type as any,
    });
    res.json(success(disputes));
  })
);

router.get(
  '/disputes/:id',
  authorize('SUPER_ADMIN', 'FINANCE_OFFICER', 'ADMIN', 'AUDITOR'),
  asyncHandler(async (req, res) => {
    const dispute = paymentDisputeService.getDispute(req.params.id, {
      id: req.user!.id,
      email: req.user!.email,
      roles: req.user!.roles,
      tenantId: (req as any).tenantId || req.user?.tenantId,
    });
    res.json(success(dispute));
  })
);

router.post(
  '/disputes/:id/evidence',
  authorize('SUPER_ADMIN', 'FINANCE_OFFICER', 'ADMIN'),
  asyncHandler(async (req, res) => {
    const updated = await paymentDisputeService.addEvidence(req.params.id, req.body, {
      id: req.user!.id,
      email: req.user!.email,
      roles: req.user!.roles,
      tenantId: (req as any).tenantId || req.user?.tenantId,
    });
    res.json(success(updated));
  })
);

router.post(
  '/disputes/:id/resolve',
  authorize('SUPER_ADMIN', 'FINANCE_OFFICER'),
  asyncHandler(async (req, res) => {
    const resolved = await paymentDisputeService.resolveDispute(req.params.id, req.body, {
      id: req.user!.id,
      email: req.user!.email,
      roles: req.user!.roles,
      tenantId: (req as any).tenantId || req.user?.tenantId,
    });
    res.json(success(resolved));
  })
);

/**
 * POST /payments/collect
 * Dedicated endpoint for Collection Officers to record borrower repayments.
 */
router.post(
  '/collect',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'COLLECTION_OFFICER'),
  asyncHandler(async (req, res) => {
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
        tenantId: (req as any).tenantId || req.user?.tenantId,
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
      tenantId: (req as any).tenantId || req.user?.tenantId,
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
      tenantId: (req as any).tenantId || req.user?.tenantId,
      branchId: req.user?.branchId,
    });
    res.json(success(result.data, result.pagination));
  })
);

router.post(
  '/submissions/:id/verify',
  authorize('FINANCE_OFFICER', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN'),
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
      tenantId: (req as any).tenantId || req.user?.tenantId,
      branchId: req.user?.branchId,
    });
    res.json(success(result));
  })
);

router.post(
  '/submissions/:id/reject',
  authorize('FINANCE_OFFICER', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN'),
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
      tenantId: (req as any).tenantId || req.user?.tenantId,
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
    if (!isStaff && (payment as any).customer?.userId !== req.user?.id) {
      throw new ForbiddenError('Access forbidden: You cannot view another borrower payment record');
    }
    res.json(success(payment));
  })
);

router.post(
  '/',
  authorize('FINANCE_OFFICER', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'CUSTOMER'),
  validate(recordPaymentSchema),
  asyncHandler(async (req, res) => {
    if (
      req.user?.roles?.includes('COLLECTION_OFFICER') &&
      !req.user?.roles?.some((r: string) => ['SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN'].includes(r))
    ) {
      throw new ForbiddenError(
        'Access forbidden: Collection Officers cannot directly modify accounting ledger entries. Repayments must be recorded and submitted for Finance verification and reconciliation.'
      );
    }

    const isStaff = req.user?.roles.some((r) =>
      ['FINANCE_OFFICER', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN'].includes(r)
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
