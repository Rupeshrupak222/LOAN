import { Router } from 'express';
import { prisma } from '../../config/prisma';
import { asyncHandler } from '../../common/asyncHandler';
import { success } from '../../common/response';
import { BadRequestError, ForbiddenError, NotFoundError } from '../../common/errors';
import { authenticate, authorize } from '../../middleware/auth';
import { verifyGeminiConnection, generateGeminiContent } from './gemini.service';
import { handleCopilotChat } from './copilot.service';
import { generateCreditIntelligence } from './credit-intelligence.service';
import { generateUnderwritingIntelligence } from './underwriting-intelligence.service';
import { analyzeDocumentIntelligence } from './document-intelligence.service';
import { generateDisbursementIntelligence } from './disbursement-intelligence.service';
import { generateCollectionIntelligence } from './collections-intelligence.service';
import { generateCustomer360Intelligence } from './customer-360-intelligence.service';
import { generateDecisionIntelligence } from './decision-intelligence.service';
import { generateWorkflowExceptionIntelligence } from './workflow-exception.service';
import { generateFraudIntelligence } from './fraud-intelligence.service';

const router = Router();

// Require authentication for all AI routes
router.use(authenticate);

/**
 * GET /api/v1/ai/test
 * Test endpoint to verify Google Gemini API connectivity (Admin only).
 */
router.get(
  '/test',
  authorize('SUPER_ADMIN', 'ADMIN'),
  asyncHandler(async (_req, res) => {
    const result = await verifyGeminiConnection();
    res.json(
      success({
        status: 'OK',
        message: result.sampleResponse,
        model: result.model,
        timestamp: new Date().toISOString(),
      })
    );
  })
);

/**
 * POST /api/v1/ai/test
 * Allows sending a test prompt to verify dynamic response generation (Admin only).
 */
router.post(
  '/test',
  authorize('SUPER_ADMIN', 'ADMIN'),
  asyncHandler(async (req, res) => {
    const prompt = req.body.prompt || 'Respond with exactly: Gemini connection successful.';
    const systemInstruction = req.body.systemInstruction;
    const model = req.body.model;

    const result = await generateGeminiContent({
      prompt,
      systemInstruction,
      model,
    });

    res.json(
      success({
        status: 'OK',
        response: result.text,
        model: result.model,
        finishReason: result.finishReason,
      })
    );
  })
);

/**
 * POST /api/v1/ai/copilot/chat
 * Role-aware, context-enriched conversational Copilot endpoint powered by Google Gemini.
 */
router.post(
  '/copilot/chat',
  asyncHandler(async (req, res) => {
    const message = req.body.message;
    if (!message || typeof message !== 'string' || message.trim() === '') {
      throw new BadRequestError('Message cannot be empty');
    }

    const history = Array.isArray(req.body.history) ? req.body.history : [];
    const currentPath = req.body.currentPath;

    const result = await handleCopilotChat({
      userId: req.user!.id,
      userEmail: req.user!.email,
      roles: req.user!.roles,
      message: message.trim(),
      history,
      currentPath,
    });

    res.json(success(result));
  })
);

/**
 * POST /api/v1/ai/applications/:id/credit-intelligence
 * Evaluates and returns AI-driven decision-support credit intelligence for a specific application.
 */
router.post(
  '/applications/:id/credit-intelligence',
  authorize('SUPER_ADMIN', 'ADMIN', 'UNDERWRITER', 'CREDIT_ANALYST', 'BRANCH_MANAGER', 'AUDITOR'),
  asyncHandler(async (req, res) => {
    const result = await generateCreditIntelligence(req.params.id, {
      id: req.user!.id,
      email: req.user!.email,
      roles: req.user!.roles,
    });

    res.json(success(result));
  })
);

/**
 * POST /api/v1/ai/applications/:id/underwriting-intelligence
 * Synthesizes loan proposal facts, risk pillars, and policy rules into an explainable Underwriting Intelligence briefing.
 */
router.post(
  '/applications/:id/underwriting-intelligence',
  authorize('SUPER_ADMIN', 'ADMIN', 'UNDERWRITER', 'CREDIT_ANALYST', 'BRANCH_MANAGER', 'AUDITOR'),
  asyncHandler(async (req, res) => {
    const result = await generateUnderwritingIntelligence(req.params.id, {
      id: req.user!.id,
      email: req.user!.email,
      roles: req.user!.roles,
    });

    res.json(success(result));
  })
);

/**
 * POST /api/v1/ai/documents/:id/analyze
 * Analyzes uploaded KYC/compliance document, extracts fields, and detects mismatches against LMS borrower record.
 */
router.post(
  '/documents/:id/analyze',
  asyncHandler(async (req, res) => {
    const isStaff = req.user?.roles.some((r) =>
      ['SUPER_ADMIN', 'ADMIN', 'LOAN_OFFICER', 'CREDIT_ANALYST', 'UNDERWRITER', 'BRANCH_MANAGER', 'AUDITOR', 'COLLECTION_OFFICER', 'FINANCE_OFFICER'].includes(r)
    );

    if (!isStaff) {
      const doc = await prisma.document.findUnique({
        where: { id: req.params.id },
        include: { customer: true },
      });
      if (!doc || doc.customer?.userId !== req.user?.id) {
        throw new ForbiddenError('Access forbidden: You cannot analyze another borrower document');
      }
    }

    const result = await analyzeDocumentIntelligence(req.params.id, {
      id: req.user!.id,
      email: req.user!.email,
      roles: req.user!.roles,
    });

    res.json(success(result));
  })
);

/**
 * POST /api/v1/ai/applications/:id/disbursement-intelligence
 * Evaluates pre-disbursement readiness, financial deductions, beneficiary validation, and UTR integrity.
 */
router.post(
  '/applications/:id/disbursement-intelligence',
  authorize('SUPER_ADMIN', 'ADMIN', 'FINANCE_OFFICER', 'DISBURSEMENT_OFFICER', 'BRANCH_MANAGER', 'UNDERWRITER', 'AUDITOR'),
  asyncHandler(async (req, res) => {
    const { utrReference } = req.body || {};
    const result = await generateDisbursementIntelligence(
      req.params.id,
      {
        id: req.user!.id,
        email: req.user!.email,
        roles: req.user!.roles,
      },
      utrReference
    );

    res.json(success(result));
  })
);

/**
 * POST /api/v1/ai/collections/:id/intelligence
 * Evaluates delinquent account risks, early warning signals, PTP commitments, and next-best recovery actions.
 */
router.post(
  '/collections/:id/intelligence',
  authorize('SUPER_ADMIN', 'ADMIN', 'COLLECTION_OFFICER', 'BRANCH_MANAGER', 'FINANCE_OFFICER', 'AUDITOR'),
  asyncHandler(async (req, res) => {
    const result = await generateCollectionIntelligence(req.params.id, {
      id: req.user!.id,
      email: req.user!.email,
      roles: req.user!.roles,
    });

    res.json(success(result));
  })
);

/**
 * POST /api/v1/ai/customers/:id/customer-360
 * Synthesizes holistic borrower intelligence across onboarding, loans, repayments, and collections.
 */
router.post(
  '/customers/:id/customer-360',
  asyncHandler(async (req, res) => {
    const isStaff = req.user?.roles.some((r) =>
      ['SUPER_ADMIN', 'ADMIN', 'LOAN_OFFICER', 'CREDIT_ANALYST', 'UNDERWRITER', 'BRANCH_MANAGER', 'AUDITOR', 'COLLECTION_OFFICER', 'FINANCE_OFFICER'].includes(r)
    );

    if (!isStaff) {
      const cust = await prisma.customer.findUnique({
        where: { id: req.params.id },
      });
      if (!cust || cust.userId !== req.user?.id) {
        throw new ForbiddenError('Access forbidden: You cannot view another borrower customer intelligence');
      }
    }

    const result = await generateCustomer360Intelligence(req.params.id, {
      id: req.user!.id,
      email: req.user!.email,
      roles: req.user!.roles,
    });

    res.json(success(result));
  })
);

/**
 * POST /api/v1/ai/dashboard/decision-intelligence
 * Synthesizes executive Decision Intelligence across portfolio KPIs, bottlenecks, and branch performance.
 */
router.post(
  '/dashboard/decision-intelligence',
  authorize('SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER', 'UNDERWRITER', 'CREDIT_ANALYST', 'AUDITOR'),
  asyncHandler(async (req, res) => {
    const result = await generateDecisionIntelligence({
      id: req.user!.id,
      email: req.user!.email,
      roles: req.user!.roles,
      branchId: (req.user as any)?.branchId,
    });

    res.json(success(result));
  })
);

/**
 * POST /api/v1/ai/exceptions/center
 * Aggregates centralized operational exceptions across KYC, underwriting, disbursements, repayments, and collections.
 */
router.post(
  '/exceptions/center',
  authorize('SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER', 'UNDERWRITER', 'AUDITOR', 'FINANCE_OFFICER', 'COLLECTION_OFFICER'),
  asyncHandler(async (req, res) => {
    const result = await generateWorkflowExceptionIntelligence({
      id: req.user!.id,
      email: req.user!.email,
      roles: req.user!.roles,
      branchId: (req.user as any)?.branchId,
    });

    res.json(success(result));
  })
);

/**
 * POST /api/v1/ai/fraud/portfolio
 * Aggregates enterprise and branch-level fraud, duplicate, and anomaly signals for staff.
 */
router.post(
  '/fraud/portfolio',
  authorize('SUPER_ADMIN', 'ADMIN', 'UNDERWRITER', 'CREDIT_ANALYST', 'BRANCH_MANAGER', 'AUDITOR'),
  asyncHandler(async (req, res) => {
    const { forceRefresh } = req.body || {};
    const result = await generateFraudIntelligence({
      scope: 'PORTFOLIO',
      forceRefresh: Boolean(forceRefresh),
      actor: {
        id: req.user!.id,
        email: req.user!.email,
        roles: req.user!.roles,
        branchId: (req.user as any)?.branchId,
      },
    });

    res.json(success(result));
  })
);

/**
 * POST /api/v1/ai/fraud/applications/:id
 * Evaluates fraud, duplicate attribute, and anomaly signals for a specific loan application.
 */
router.post(
  '/fraud/applications/:id',
  authorize('SUPER_ADMIN', 'ADMIN', 'UNDERWRITER', 'CREDIT_ANALYST', 'BRANCH_MANAGER', 'AUDITOR'),
  asyncHandler(async (req, res) => {
    const { forceRefresh } = req.body || {};
    const result = await generateFraudIntelligence({
      scope: 'APPLICATION',
      applicationId: req.params.id,
      forceRefresh: Boolean(forceRefresh),
      actor: {
        id: req.user!.id,
        email: req.user!.email,
        roles: req.user!.roles,
        branchId: (req.user as any)?.branchId,
      },
    });

    res.json(success(result));
  })
);

/**
 * POST /api/v1/ai/fraud/customers/:id
 * Evaluates borrower identity, shared bank accounts, phone duplicates, and network clusters for a customer.
 */
router.post(
  '/fraud/customers/:id',
  authorize('SUPER_ADMIN', 'ADMIN', 'UNDERWRITER', 'CREDIT_ANALYST', 'BRANCH_MANAGER', 'AUDITOR'),
  asyncHandler(async (req, res) => {
    const { forceRefresh } = req.body || {};
    const result = await generateFraudIntelligence({
      scope: 'CUSTOMER',
      customerId: req.params.id,
      forceRefresh: Boolean(forceRefresh),
      actor: {
        id: req.user!.id,
        email: req.user!.email,
        roles: req.user!.roles,
        branchId: (req.user as any)?.branchId,
      },
    });

    res.json(success(result));
  })
);

export default router;
