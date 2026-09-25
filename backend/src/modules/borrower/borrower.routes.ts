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
  requestedTenureMonths: z.number().int().min(1).max(120),
  monthlyIncome: z.number().positive(),
  existingMonthlyEmi: z.number().nonnegative().optional(),
  employmentType: z.enum(['SALARIED', 'SELF_EMPLOYED', 'BUSINESS', 'PROFESSIONAL', 'STUDENT', 'FREELANCER', 'FARMER', 'OTHER']),
});

const applicationSchema = z.object({
  productId: z.string().min(1),
  requestedAmount: z.number().positive(),
  tenureMonths: z.number().int().min(1).max(120),
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
  employmentType: z.enum(['SALARIED', 'SELF_EMPLOYED', 'BUSINESS', 'PROFESSIONAL', 'STUDENT', 'FREELANCER', 'FARMER', 'OTHER']),
  employerName: z.string().optional(),
  designation: z.string().optional(),
  workExperienceYears: z.number().optional(),
  businessName: z.string().optional(),
  businessRegistrationType: z.string().optional(),
  gstin: z.string().optional(),
  annualTurnover: z.number().optional(),
  professionType: z.string().optional(),
  institutionName: z.string().optional(),
  courseName: z.string().optional(),
  coApplicantName: z.string().optional(),
  coApplicantRelation: z.string().optional(),
  coApplicantIncome: z.number().optional(),
  landAreaAcres: z.number().optional(),
  cropType: z.string().optional(),
  kccLimit: z.number().optional(),
  farmLocation: z.string().optional(),
  clientRemittanceType: z.string().optional(),
  monthlyIncome: z.number().nonnegative(),
  existingEmiObligations: z.number().nonnegative().optional(),
  panNumber: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i, 'Invalid PAN format'),
  aadhaarNumberMasked: z.string().min(4),
  kycConsentGiven: z.boolean(),
  documentIds: z.array(z.string()).optional(),
  accountHolderName: z.string().min(2),
  accountNumber: z.string().min(6),
  ifscCode: z.string().min(4),
  bankName: z.string().min(2),
  accountType: z.enum(['SAVINGS', 'CURRENT']),
  creditBureauConsent: z.boolean(),
  termsAccepted: z.boolean(),
});

const draftApplicationSchema = z.object({
  applicationId: z.string().optional(),
  productId: z.string().optional(),
  requestedAmount: z.number().positive().optional(),
  tenureMonths: z.number().int().min(1).max(120).optional(),
  purpose: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  dob: z.string().optional(),
  gender: z.string().optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  employmentType: z.enum(['SALARIED', 'SELF_EMPLOYED', 'BUSINESS', 'PROFESSIONAL', 'STUDENT', 'FREELANCER', 'FARMER', 'OTHER']).optional(),
  employerName: z.string().optional(),
  designation: z.string().optional(),
  workExperienceYears: z.number().optional(),
  businessName: z.string().optional(),
  businessRegistrationType: z.string().optional(),
  gstin: z.string().optional(),
  annualTurnover: z.number().optional(),
  professionType: z.string().optional(),
  institutionName: z.string().optional(),
  courseName: z.string().optional(),
  coApplicantName: z.string().optional(),
  coApplicantRelation: z.string().optional(),
  coApplicantIncome: z.number().optional(),
  monthlyIncome: z.number().nonnegative().optional(),
  existingEmiObligations: z.number().nonnegative().optional(),
  panNumber: z.string().optional(),
  aadhaarNumberMasked: z.string().optional(),
  accountHolderName: z.string().optional(),
  accountNumber: z.string().optional(),
  ifscCode: z.string().optional(),
  bankName: z.string().optional(),
  accountType: z.enum(['SAVINGS', 'CURRENT']).optional(),
  documentIds: z.array(z.string()).optional(),
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

const ptpSchema = z.object({
  loanId: z.string().min(1),
  promisedAmount: z.number().positive(),
  promisedDate: z.string().min(1),
  paymentMode: z.enum(['UPI', 'NET_BANKING', 'DEBIT_CARD', 'NACH']).optional(),
  notes: z.string().optional(),
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

// 3.1 Get Active / In-Flight Application or Draft
router.get(
  '/applications/active',
  asyncHandler(async (req, res) => {
    const activeApp = await borrowerService.getActiveBorrowerApplication(req.user!.id, req.user?.tenantId);
    res.json(success(activeApp));
  })
);

// 3.2 Save / Resume Application Draft
router.post(
  '/applications/draft',
  validate(draftApplicationSchema),
  asyncHandler(async (req, res) => {
    const draft = await borrowerService.saveBorrowerDraftApplication(req.user!.id, req.body, req.user?.tenantId);
    res.json(success(draft));
  })
);

// 3.3 Get Specific Application Details by ID
router.get(
  '/applications/:applicationId',
  asyncHandler(async (req, res) => {
    const app = await borrowerService.getBorrowerApplicationById(req.user!.id, req.params.applicationId, req.user?.tenantId);
    res.json(success(app));
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

// 5. List All Borrower Offers
router.get(
  '/offers',
  asyncHandler(async (req, res) => {
    const offers = await borrowerService.getBorrowerOffers(req.user!.id, req.user?.tenantId);
    res.json(success(offers));
  })
);

// 5.1 Get Specific Offer Details
router.get(
  '/offers/:offerId',
  asyncHandler(async (req, res) => {
    const offer = await borrowerService.getBorrowerOfferDetails(req.user!.id, req.params.offerId, req.user?.tenantId);
    res.json(success(offer));
  })
);

// 5.2 Get Statutory Key Fact Statement (KFS)
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
    const result = await borrowerService.acceptBorrowerOffer(req.user!.id, req.params.offerId, req.body, req.user?.tenantId);
    res.json(success(result));
  })
);

// 6.1 Decline Loan Offer
router.post(
  '/offers/:offerId/decline',
  asyncHandler(async (req, res) => {
    const result = await borrowerService.declineBorrowerOffer(req.user!.id, req.params.offerId, req.body, req.user?.tenantId);
    res.json(success(result));
  })
);

// 6.2 Get Digital Loan Agreement & Contract Status
router.get(
  '/applications/:applicationId/agreement',
  asyncHandler(async (req, res) => {
    const agreement = await borrowerService.getBorrowerAgreement(req.user!.id, req.params.applicationId, req.user?.tenantId);
    res.json(success(agreement));
  })
);

router.get(
  '/agreements/:applicationId',
  asyncHandler(async (req, res) => {
    const agreement = await borrowerService.getBorrowerAgreement(req.user!.id, req.params.applicationId, req.user?.tenantId);
    res.json(success(agreement));
  })
);

router.get(
  '/applications/:applicationId/contract-status',
  asyncHandler(async (req, res) => {
    const agreement = await borrowerService.getBorrowerAgreement(req.user!.id, req.params.applicationId, req.user?.tenantId);
    res.json(success(agreement));
  })
);

// 6.3 Pre-Disbursement, Finance Processing & Payout Status Visibility
router.get(
  '/applications/:applicationId/disbursement-status',
  asyncHandler(async (req, res) => {
    const status = await borrowerService.getBorrowerDisbursementStatus(req.user!.id, req.params.applicationId, req.user?.tenantId);
    res.json(success(status));
  })
);

router.get(
  '/disbursement-status/:applicationId',
  asyncHandler(async (req, res) => {
    const status = await borrowerService.getBorrowerDisbursementStatus(req.user!.id, req.params.applicationId, req.user?.tenantId);
    res.json(success(status));
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

router.post(
  '/payments',
  validate(repaymentSchema),
  asyncHandler(async (req, res) => {
    const result = await borrowerService.processBorrowerRepayment(req.user!.id, req.body, req.user?.tenantId);
    res.json(success(result));
  })
);

// 11.1 Payment History & Transactions Ledger
router.get(
  '/payments',
  asyncHandler(async (req, res) => {
    const loanId = req.query.loanId ? String(req.query.loanId) : undefined;
    const payments = await borrowerService.getBorrowerPayments(req.user!.id, loanId, req.user?.tenantId);
    res.json(success(payments));
  })
);

router.get(
  '/loans/:loanId/payments',
  asyncHandler(async (req, res) => {
    const payments = await borrowerService.getBorrowerPayments(req.user!.id, req.params.loanId, req.user?.tenantId);
    res.json(success(payments));
  })
);

// 11.2 Authoritative Overdue Summary & Delinquency (Phase M7)
router.get(
  '/overdue',
  asyncHandler(async (req, res) => {
    const summary = await borrowerService.getBorrowerOverdueSummary(req.user!.id, req.user?.tenantId);
    res.json(success(summary));
  })
);

// 11.3 Promise to Pay (PTP) Registration (Phase M7)
router.post(
  '/ptp',
  validate(ptpSchema),
  asyncHandler(async (req, res) => {
    const ptp = await borrowerService.createBorrowerPtp(req.user!.id, req.body, req.user?.tenantId);
    res.json(success(ptp));
  })
);

// 11.4 Promise to Pay (PTP) History
router.get(
  '/ptp',
  asyncHandler(async (req, res) => {
    const loanId = req.query.loanId ? String(req.query.loanId) : undefined;
    const ptps = await borrowerService.getBorrowerPtps(req.user!.id, loanId, req.user?.tenantId);
    res.json(success(ptps));
  })
);

router.get(
  '/loans/:loanId/ptp',
  asyncHandler(async (req, res) => {
    const ptps = await borrowerService.getBorrowerPtps(req.user!.id, req.params.loanId, req.user?.tenantId);
    res.json(success(ptps));
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

// 12.1 Authoritative Statement of Account (SOA)
router.get(
  '/loans/:loanId/statement',
  asyncHandler(async (req, res) => {
    const statement = await borrowerService.getBorrowerLoanStatement(req.user!.id, req.params.loanId, req.user?.tenantId);
    res.json(success(statement));
  })
);


// 14. Real-Time Borrower Journey State
router.get(
  '/journey-state',
  asyncHandler(async (req, res) => {
    const journey = await borrowerService.getBorrowerJourneyState(req.user!.id, req.user?.tenantId);
    res.json(success(journey));
  })
);

// 15. Consents Ledger & Audit
router.get(
  '/consents',
  asyncHandler(async (req, res) => {
    const consents = await borrowerService.getBorrowerConsents(req.user!.id, req.user?.tenantId);
    res.json(success(consents));
  })
);

router.post(
  '/consents',
  asyncHandler(async (req, res) => {
    const consent = await borrowerService.recordBorrowerConsent(req.user!.id, req.body, req.user?.tenantId);
    res.status(201).json(success(consent));
  })
);

// 16. Borrower Document Vault
router.get(
  '/documents',
  asyncHandler(async (req, res) => {
    const documents = await borrowerService.getBorrowerDocuments(req.user!.id, req.user?.tenantId);
    res.json(success(documents));
  })
);

// 17. Borrower Detailed Profile
router.get(
  '/profile',
  asyncHandler(async (req, res) => {
    const profile = await borrowerService.getBorrowerDetailedProfile(req.user!.id, req.user?.tenantId);
    res.json(success(profile));
  })
);

// 18. Update Borrower Profile
router.patch(
  '/profile',
  asyncHandler(async (req, res) => {
    const updated = await borrowerService.updateBorrowerProfile(req.user!.id, req.body, req.user?.tenantId);
    res.json(success(updated));
  })
);

export default router;
