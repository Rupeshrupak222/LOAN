import { Router } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { success } from '../../common/response';
import { validate } from '../../middleware/validate';
import { authenticate, authorize } from '../../middleware/auth';
import {
  submitCreditDecisionSchema,
  verifyFinancialsSchema,
  verifyKycStepSchema,
  verifyDocumentStepSchema,
  batchVerifyDocumentsStepSchema,
  evaluateFinancialStepSchema,
  recordRiskStepSchema,
  returnToLoanOfficerSchema,
} from './credit.schema';
import {
  getFinancialCapacity,
  startCreditAssessment,
  verifyKycStep,
  verifyDocumentStep,
  batchVerifyDocumentsStep,
  evaluateFinancialEligibilityStep,
  recordRiskAssessmentStep,
  submitCreditDecision,
  verifyFinancials,
  getCreditQueue,
  returnToLoanOfficer,
} from './credit.service';

const router = Router();

router.use(authenticate);

/**
 * GET /api/v1/credit/queue
 * Returns Credit Assessment Queue with live Credit Analyst metrics grouped by workflow stage.
 */
router.get(
  '/queue',
  authorize('SUPER_ADMIN', 'ADMIN', 'CREDIT_ANALYST'),
  asyncHandler(async (req, res) => {
    const queue = await getCreditQueue((req.query as any)?.tab);
    res.json(success(queue));
  })
);

/**
 * GET /api/v1/credit/applications/:id/capacity
 * Returns full financial repayment capacity, 7-step checklist, DTI, FOIR, disposable income, and bureau score.
 */
router.get(
  '/applications/:id/capacity',
  authorize(
    'SUPER_ADMIN',
    'ADMIN',
    'CREDIT_ANALYST',
    'UNDERWRITER',
    'BRANCH_MANAGER',
    'AUDITOR'
  ),
  asyncHandler(async (req, res) => {
    const data = await getFinancialCapacity(req.params.id);
    res.json(success(data));
  })
);

/**
 * POST /api/v1/credit/applications/:id/start-assessment
 * Step 1: Initiates formal credit assessment (SUBMITTED -> CREDIT_ASSESSMENT).
 */
router.post(
  '/applications/:id/start-assessment',
  authorize('SUPER_ADMIN', 'ADMIN', 'CREDIT_ANALYST'),
  asyncHandler(async (req, res) => {
    const result = await startCreditAssessment(req.params.id, req.user as any);
    res.json(success(result));
  })
);

/**
 * POST /api/v1/credit/applications/:id/verify-kyc
 * Step 2: Verifies customer identity & KYC compliance (VERIFIED, FAILED, PENDING).
 */
router.post(
  '/applications/:id/verify-kyc',
  authorize('SUPER_ADMIN', 'ADMIN', 'CREDIT_ANALYST'),
  validate(verifyKycStepSchema),
  asyncHandler(async (req, res) => {
    const result = await verifyKycStep(req.params.id, req.body, req.user as any);
    res.json(success(result));
  })
);

/**
 * POST /api/v1/credit/applications/:id/verify-document
 * Step 3: Verifies an individual document in the checklist.
 */
router.post(
  '/applications/:id/verify-document',
  authorize('SUPER_ADMIN', 'ADMIN', 'CREDIT_ANALYST'),
  validate(verifyDocumentStepSchema),
  asyncHandler(async (req, res) => {
    const result = await verifyDocumentStep(req.params.id, req.body, req.user as any);
    res.json(success(result));
  })
);

/**
 * POST /api/v1/credit/applications/:id/batch-verify-documents
 * Step 3: Batch verifies documents in the checklist.
 */
router.post(
  '/applications/:id/batch-verify-documents',
  authorize('SUPER_ADMIN', 'ADMIN', 'CREDIT_ANALYST'),
  validate(batchVerifyDocumentsStepSchema),
  asyncHandler(async (req, res) => {
    const result = await batchVerifyDocumentsStep(req.params.id, req.body, req.user as any);
    res.json(success(result));
  })
);

/**
 * POST /api/v1/credit/applications/:id/evaluate-financials
 * Step 4: Runs policy financial eligibility verification (Income, FOIR, DTI).
 */
router.post(
  '/applications/:id/evaluate-financials',
  authorize('SUPER_ADMIN', 'ADMIN', 'CREDIT_ANALYST'),
  validate(evaluateFinancialStepSchema),
  asyncHandler(async (req, res) => {
    const result = await evaluateFinancialEligibilityStep(req.params.id, req.body, req.user as any);
    res.json(success(result));
  })
);

/**
 * POST /api/v1/credit/applications/:id/evaluate-risk
 * Step 5: Computes 4-pillar credit risk assessment.
 */
router.post(
  '/applications/:id/evaluate-risk',
  authorize('SUPER_ADMIN', 'ADMIN', 'CREDIT_ANALYST'),
  validate(recordRiskStepSchema),
  asyncHandler(async (req, res) => {
    const result = await recordRiskAssessmentStep(req.params.id, req.body, req.user as any);
    res.json(success(result));
  })
);

/**
 * POST /api/v1/credit/applications/:id/decision
 * Step 6 & 7: Submits official credit assessment decision (ELIGIBLE, NOT_ELIGIBLE, FURTHER_REVIEW, REQUEST_ADDITIONAL_DOCS).
 * Enforces sequential prerequisites: KYC, Documents, Financial Eligibility, and Risk Assessment.
 */
router.post(
  '/applications/:id/decision',
  authorize('SUPER_ADMIN', 'ADMIN', 'CREDIT_ANALYST'),
  validate(submitCreditDecisionSchema),
  asyncHandler(async (req, res) => {
    const result = await submitCreditDecision(
      req.params.id,
      req.body,
      req.user as any
    );
    res.json(success(result));
  })
);

/**
 * POST /api/v1/credit/applications/:id/verify-financials
 * Verifies income and employment details independently.
 */
router.post(
  '/applications/:id/verify-financials',
  authorize('SUPER_ADMIN', 'ADMIN', 'CREDIT_ANALYST'),
  validate(verifyFinancialsSchema),
  asyncHandler(async (req, res) => {
    const result = await verifyFinancials(
      req.params.id,
      req.body,
      req.user as any
    );
    res.json(success(result));
  })
);

/**
 * POST /api/v1/credit/applications/:id/return-to-loan-officer
 * Returns proposal to Loan Officer or Customer for correction
 */
router.post(
  '/applications/:id/return-to-loan-officer',
  authorize('SUPER_ADMIN', 'ADMIN', 'CREDIT_ANALYST', 'BRANCH_MANAGER'),
  validate(returnToLoanOfficerSchema),
  asyncHandler(async (req, res) => {
    const result = await returnToLoanOfficer(
      req.params.id,
      req.body,
      req.user as any
    );
    res.json(success(result));
  })
);

export default router;
