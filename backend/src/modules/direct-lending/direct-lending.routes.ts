import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../common/asyncHandler';
import { success } from '../../common/response';
import { authenticate, authorize } from '../../middleware/auth';
import { tenantContext } from '../../middleware/tenant-context';
import { validate } from '../../middleware/validate';
import { directLendingService } from './direct-lending.service';
import { customerLifecycleService } from './customer-lifecycle.service';
import { repeatBorrowingService } from './repeat-borrowing.service';
import { creditReassessmentService } from './credit-reassessment.service';
import { consentService } from './consent.service';
import { prisma } from '../../config/prisma';
import { ForbiddenError, NotFoundError } from '../../common/errors';

const router = Router();

// Validation Schemas
const preQualifySchema = z.object({
  requestedAmount: z.number().positive(),
  tenureMonths: z.number().int().positive(),
  productId: z.string().optional(),
  monthlyIncome: z.number().optional(),
  employmentType: z.string().optional(),
  city: z.string().optional(),
  pincode: z.string().optional(),
});

const directApplySchema = z.object({
  productId: z.string().uuid(),
  requestedAmount: z.number().positive(),
  tenureMonths: z.number().int().positive(),
  purpose: z.string().optional(),
  bankAccountId: z.string().optional(),
  consentIds: z.array(z.string()).optional(),
});

const acceptOfferSchema = z.object({
  offerId: z.string().uuid(),
});

const creditReassessmentSchema = z.object({
  requestedLimit: z.number().positive().optional(),
  reassessmentType: z.string().optional(),
  reason: z.string().optional(),
});

const approveReassessmentSchema = z.object({
  approvedLimit: z.number().positive(),
});

const drawdownSchema = z.object({
  facilityId: z.string().uuid(),
  amount: z.number().positive(),
});

const consentSchema = z.object({
  consentType: z.string(),
  purpose: z.string(),
  version: z.string().optional(),
  channel: z.string().optional(),
});

// 1. Pre-Qualification (Can be accessed with or without auth)
router.post(
  '/pre-qualify',
  validate(preQualifySchema),
  asyncHandler(async (req, res) => {
    const customerId = (req as any).user?.id;
    const tenantId = (req as any).tenantId || (req as any).user?.tenantId;
    const result = await directLendingService.preQualifyCustomer(
      req.body,
      customerId,
      tenantId
    );
    res.json(success(result));
  })
);

// Authenticated Endpoints
router.use(authenticate);
router.use(tenantContext);

// Helper to resolve customer ID from user
async function resolveCustomerId(userId: string, tenantId?: string): Promise<string> {
  const customer = await prisma.customer.findFirst({
    where: {
      userId,
      ...(tenantId ? { tenantId } : {}),
    },
    select: { id: true },
  });
  if (!customer) {
    throw new NotFoundError('Customer profile not found for current user');
  }
  return customer.id;
}

// 2. Personalized Next Action
router.get(
  '/next-action',
  asyncHandler(async (req, res) => {
    const customerId = await resolveCustomerId(req.user?.id!, req.user?.tenantId);
    const action = await customerLifecycleService.deriveNextAction(
      customerId,
      req.user?.tenantId
    );
    res.json(success(action));
  })
);

// 3. Customer Lifecycle State
router.get(
  '/lifecycle',
  asyncHandler(async (req, res) => {
    const customerId = await resolveCustomerId(req.user?.id!, req.user?.tenantId);
    const state = await customerLifecycleService.computeLifecycleState(
      customerId,
      req.user?.tenantId
    );
    const history = await prisma.customerLifecycleHistory.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    res.json(success({ currentState: state, history }));
  })
);

// 4. Submit Direct Loan Application
router.post(
  '/apply',
  validate(directApplySchema),
  asyncHandler(async (req, res) => {
    const customerId = await resolveCustomerId(req.user?.id!, req.user?.tenantId);
    const application = await directLendingService.applyDirectLoan(
      customerId,
      req.user?.tenantId,
      req.body
    );
    res.status(201).json(success(application));
  })
);

// 5. Trigger Instant Automated Decision
router.post(
  '/applications/:id/decision',
  asyncHandler(async (req, res) => {
    const customerId = await resolveCustomerId(req.user?.id!, req.user?.tenantId);
    const decision = await directLendingService.evaluateInstantDecision(
      req.params.id,
      customerId,
      req.user?.tenantId
    );
    res.json(success(decision));
  })
);

// 6. Accept Offer & Complete eSign / Mandate
router.post(
  '/applications/:id/accept-offer',
  validate(acceptOfferSchema),
  asyncHandler(async (req, res) => {
    const customerId = await resolveCustomerId(req.user?.id!, req.user?.tenantId);
    const offer = await directLendingService.acceptOfferAndSign(
      req.params.id,
      req.body.offerId,
      customerId,
      req.user?.tenantId
    );
    res.json(success(offer));
  })
);

// 7. Trigger Instant Loan Disbursement
router.post(
  '/applications/:id/disburse',
  asyncHandler(async (req, res) => {
    const customerId = await resolveCustomerId(req.user?.id!, req.user?.tenantId);
    const loan = await directLendingService.disburseLoan(
      req.params.id,
      customerId,
      req.user?.tenantId
    );
    res.json(success(loan));
  })
);

// 8. Safe Borrower Loan Detail (Zero internal leakage)
router.get(
  '/loans/:id/safe-view',
  asyncHandler(async (req, res) => {
    const isStaff = req.user?.roles.some((r) =>
      ['SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'LOAN_OFFICER', 'CREDIT_ANALYST'].includes(r)
    );
    let customerId = '';
    if (!isStaff) {
      customerId = await resolveCustomerId(req.user?.id!, req.user?.tenantId);
    } else {
      const loan = await prisma.loan.findUnique({
        where: { id: req.params.id },
        select: { customerId: true },
      });
      if (!loan) throw new NotFoundError('Loan not found');
      customerId = loan.customerId;
    }

    const detail = await directLendingService.getSafeBorrowerLoanDetail(
      req.params.id,
      customerId,
      req.user?.tenantId
    );
    res.json(success(detail));
  })
);

// 9. Repeat Borrowing Pre-Qualification
router.get(
  '/repeat-eligibility',
  asyncHandler(async (req, res) => {
    const customerId = await resolveCustomerId(req.user?.id!, req.user?.tenantId);
    const evalResult = await repeatBorrowingService.evaluateRepeatBorrower(
      customerId,
      req.user?.tenantId
    );
    res.json(success(evalResult));
  })
);

// 10. Request Credit Limit Reassessment
router.post(
  '/credit-reassessment',
  validate(creditReassessmentSchema),
  asyncHandler(async (req, res) => {
    const customerId = await resolveCustomerId(req.user?.id!, req.user?.tenantId);
    const result = await creditReassessmentService.requestLimitReassessment(
      customerId,
      req.user?.tenantId,
      req.body
    );
    res.json(success(result));
  })
);

// 11. Approve Credit Limit Reassessment (Maker-Checker / Underwriter)
router.post(
  '/credit-reassessment/:id/approve',
  authorize('CREDIT_ANALYST', 'UNDERWRITER', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN'),
  validate(approveReassessmentSchema),
  asyncHandler(async (req, res) => {
    const result = await creditReassessmentService.approveReassessment(
      req.params.id,
      req.body.approvedLimit,
      req.user?.id!,
      req.user?.tenantId
    );
    res.json(success(result));
  })
);

// 12. Instant Drawdown from Credit Line
router.post(
  '/drawdown',
  validate(drawdownSchema),
  asyncHandler(async (req, res) => {
    const customerId = await resolveCustomerId(req.user?.id!, req.user?.tenantId);
    const drawdown = await directLendingService.drawdownRevolvingCredit(
      req.body.facilityId,
      req.body.amount,
      customerId,
      req.user?.tenantId
    );
    res.json(success(drawdown));
  })
);

// 13. Digital Consent Registry
router.post(
  '/consents',
  validate(consentSchema),
  asyncHandler(async (req, res) => {
    const customerId = await resolveCustomerId(req.user?.id!, req.user?.tenantId);
    const consent = await consentService.recordConsent(
      customerId,
      req.user?.tenantId,
      {
        ...req.body,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      }
    );
    res.status(201).json(success(consent));
  })
);

router.get(
  '/consents',
  asyncHandler(async (req, res) => {
    const customerId = await resolveCustomerId(req.user?.id!, req.user?.tenantId);
    const consents = await consentService.getCustomerConsents(
      customerId,
      req.user?.tenantId
    );
    res.json(success(consents));
  })
);

export default router;
