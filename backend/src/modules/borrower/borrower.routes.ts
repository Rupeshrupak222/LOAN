import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middleware/auth';
import { tenantContext } from '../../middleware/tenant-context';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../common/asyncHandler';
import { success } from '../../common/response';
import { borrowerService } from './borrower.service';

const router = Router();

router.use(authenticate);
router.use(tenantContext);

// Validation Schemas
const eligibilitySchema = z.object({
  productId: z.string().optional(),
  requestedAmount: z.number().positive(),
  requestedTenureMonths: z.number().int().min(1).max(60),
  monthlyIncome: z.number().positive(),
  existingMonthlyEmi: z.number().nonnegative().optional(),
  employmentType: z.enum(['SALARIED', 'SELF_EMPLOYED', 'BUSINESS', 'PROFESSIONAL']),
});

const applicationSchema = z.object({
  productId: z.string().min(1),
  requestedAmount: z.number().positive(),
  tenureMonths: z.number().int().min(1).max(60),
  purpose: z.string().min(2),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dob: z.string(),
  gender: z.string(),
  addressLine1: z.string().min(3),
  addressLine2: z.string().optional(),
  city: z.string().min(2),
  state: z.string().min(2),
  pincode: z.string().min(6),
  employmentType: z.enum(['SALARIED', 'SELF_EMPLOYED', 'BUSINESS', 'PROFESSIONAL']),
  employerName: z.string().min(2),
  monthlyIncome: z.number().positive(),
  existingEmiObligations: z.number().nonnegative().optional(),
  panNumber: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i, 'Invalid PAN format'),
  aadhaarNumberMasked: z.string().min(4),
  kycConsentGiven: z.boolean(),
  accountHolderName: z.string().min(2),
  accountNumber: z.string().min(6),
  ifscCode: z.string().min(4),
  bankName: z.string().min(2),
  accountType: z.enum(['SAVINGS', 'CURRENT']),
  creditBureauConsent: z.boolean(),
  termsAccepted: z.boolean(),
});

const esignSchema = z.object({
  otp: z.string().length(6),
});

const mandateSchema = z.object({
  mandateType: z.enum(['ENACH', 'UPI_AUTOPAY']),
});

const repaymentSchema = z.object({
  loanId: z.string().min(1),
  amount: z.number().positive(),
  paymentMethod: z.enum(['UPI', 'NET_BANKING', 'DEBIT_CARD']),
  upiVpa: z.string().optional(),
  emiNumber: z.number().optional(),
});

const supportTicketSchema = z.object({
  subject: z.string().min(3),
  category: z.string().min(2),
  description: z.string().min(5),
  priority: z.string().optional(),
});

// 1. Borrower Home Overview
router.get(
  '/home',
  asyncHandler(async (req, res) => {
    const data = await borrowerService.getBorrowerHomeSummary(req.user!.id, req.user?.tenantId);
    res.json(success(data));
  })
);

// 2. Consumer Loan Products Discovery
router.get(
  '/products',
  asyncHandler(async (req, res) => {
    const products = await borrowerService.getConsumerProducts(req.user?.tenantId);
    res.json(success(products));
  })
);

// 3. Real-Time Eligibility Check
router.post(
  '/eligibility',
  validate(eligibilitySchema),
  asyncHandler(async (req, res) => {
    const result = await borrowerService.evaluateBorrowerEligibility(req.user!.id, req.body, req.user?.tenantId);
    res.json(success(result));
  })
);

// 4. Digital Loan Application Submission
router.post(
  '/apply',
  validate(applicationSchema),
  asyncHandler(async (req, res) => {
    const result = await borrowerService.submitBorrowerApplication(req.user!.id, req.body, req.user?.tenantId);
    res.status(201).json(success(result));
  })
);

// 5. Get Statutory Key Fact Statement (KFS)
router.get(
  '/offers/:offerId/kfs',
  asyncHandler(async (req, res) => {
    const kfs = await borrowerService.getBorrowerKfs(req.user!.id, req.params.offerId, req.user?.tenantId);
    res.json(success(kfs));
  })
);

// 6. Accept Loan Offer
router.post(
  '/offers/:offerId/accept',
  asyncHandler(async (req, res) => {
    const result = await borrowerService.acceptBorrowerOffer(req.user!.id, req.params.offerId, req.user?.tenantId);
    res.json(success(result));
  })
);

// 7. Aadhaar eSign Contract
router.post(
  '/applications/:applicationId/esign',
  validate(esignSchema),
  asyncHandler(async (req, res) => {
    const result = await borrowerService.executeBorrowerEsign(
      req.user!.id,
      req.params.applicationId,
      req.body.otp,
      req.user?.tenantId
    );
    res.json(success(result));
  })
);

// 8. Setup Mandate & Disburse
router.post(
  '/applications/:applicationId/mandate',
  validate(mandateSchema),
  asyncHandler(async (req, res) => {
    const result = await borrowerService.setupBorrowerMandateAndDisburse(
      req.user!.id,
      req.params.applicationId,
      req.body.mandateType,
      req.user?.tenantId
    );
    res.json(success(result));
  })
);

// 9. List Borrower Loans
router.get(
  '/loans',
  asyncHandler(async (req, res) => {
    const loans = await borrowerService.getBorrowerLoans(req.user!.id, req.user?.tenantId);
    res.json(success(loans));
  })
);

// 10. Loan Account Details & Repayment Schedule Waterfall
router.get(
  '/loans/:loanId',
  asyncHandler(async (req, res) => {
    const details = await borrowerService.getBorrowerLoanDetails(req.user!.id, req.params.loanId, req.user?.tenantId);
    res.json(success(details));
  })
);

// 11. Instant EMI Repayment
router.post(
  '/loans/:loanId/pay',
  validate(repaymentSchema),
  asyncHandler(async (req, res) => {
    const result = await borrowerService.processBorrowerRepayment(req.user!.id, req.body, req.user?.tenantId);
    res.json(success(result));
  })
);

// 12. No-Objection Certificate (NOC)
router.get(
  '/loans/:loanId/noc',
  asyncHandler(async (req, res) => {
    const noc = await borrowerService.generateBorrowerNoc(req.user!.id, req.params.loanId, req.user?.tenantId);
    res.json(success(noc));
  })
);

// 13. Create Support / Grievance Ticket
router.post(
  '/support/tickets',
  validate(supportTicketSchema),
  asyncHandler(async (req, res) => {
    const ticket = await borrowerService.createBorrowerSupportTicket(req.user!.id, req.body, req.user?.tenantId);
    res.status(201).json(success(ticket));
  })
);

export default router;
