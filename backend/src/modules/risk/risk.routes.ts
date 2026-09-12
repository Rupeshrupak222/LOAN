import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../common/asyncHandler';
import { success } from '../../common/response';
import { authenticate, authorize } from '../../middleware/auth';
import { riskEngineService } from './risk.service';
import { riskFraudMatrixService } from './risk-fraud-matrix.service';
import { BadRequestError, ForbiddenError } from '../../common/errors';

const router = Router();

router.use(authenticate);

// ---------------------------------------------------------------------------
// ZOD SCHEMAS
// ---------------------------------------------------------------------------

const evaluateRiskSchema = z.object({
  applicationId: z.string().min(1),
  overrides: z.record(z.any()).optional(),
});

const simulateRiskSchema = z.object({
  applicantAge: z.number().min(18).max(100).default(28),
  monthlyIncome: z.number().min(0).default(50000),
  existingObligations: z.number().min(0).default(10000),
  workExperienceMonths: z.number().min(0).default(24),
  bureauScore: z.number().min(300).max(900).default(740),
  averageMonthlyBalance: z.number().min(0).default(20000),
  chequeBouncesLast90d: z.number().min(0).default(0),
  requestedAmount: z.number().min(1000).default(100000),
  requestedTenureMonths: z.number().min(1).default(12),
  applicationVelocity24h: z.number().min(0).default(1),
});

const createRiskPolicySchema = z.object({
  productId: z.string().optional(),
  productCode: z.string().optional(),
  code: z.string().min(3),
  name: z.string().min(3),
  description: z.string().min(5),
  categoryWeights: z
    .object({
      CUSTOMER: z.number().min(0).max(100),
      FINANCIAL: z.number().min(0).max(100),
      CREDIT: z.number().min(0).max(100),
      BANKING: z.number().min(0).max(100),
      APPLICATION: z.number().min(0).max(100),
      BEHAVIORAL: z.number().min(0).max(100),
    })
    .optional(),
  bands: z.array(z.any()).optional(),
});

const overrideRiskSchema = z.object({
  applicationId: z.string().min(1),
  newScore: z.number().min(0).max(100),
  newGrade: z.enum(['A', 'B', 'C', 'D', 'E']),
  reason: z.string().min(5),
  comments: z.string().default('Manual risk override recorded by authorized risk officer.'),
});

// ---------------------------------------------------------------------------
// 1. EVALUATE APPLICATION RISK
// ---------------------------------------------------------------------------

router.post(
  '/evaluate',
  authorize('SUPER_ADMIN', 'ADMIN', 'COMPANY_ADMIN', 'RISK_MANAGER', 'RISK_ANALYST', 'CREDIT_ANALYST', 'UNDERWRITER', 'BRANCH_MANAGER'),
  asyncHandler(async (req, res) => {
    const body = evaluateRiskSchema.parse(req.body);
    const tenantId = req.user?.tenantId || 'tenant-adyapan-default';

    const result = await riskEngineService.evaluateApplication(
      body.applicationId,
      tenantId,
      body.overrides,
      req.user?.id
    );

    // Customer safe redaction if customer or partner role
    const isCustomerOrPartner = req.user?.roles?.some((r) => r === 'CUSTOMER' || r === 'PARTNER');
    if (isCustomerOrPartner) {
      return res.json(success(riskEngineService.getCustomerSafeSummary(result)));
    }

    res.json(success(result));
  })
);

// Backward compatible path
router.post(
  '/evaluate/:applicationId',
  authorize('SUPER_ADMIN', 'ADMIN', 'COMPANY_ADMIN', 'RISK_MANAGER', 'RISK_ANALYST', 'CREDIT_ANALYST', 'UNDERWRITER', 'BRANCH_MANAGER'),
  asyncHandler(async (req, res) => {
    const tenantId = req.user?.tenantId || 'tenant-adyapan-default';
    const result = await riskEngineService.evaluateApplication(
      req.params.applicationId,
      tenantId,
      {},
      req.user?.id
    );

    const isCustomerOrPartner = req.user?.roles?.some((r) => r === 'CUSTOMER' || r === 'PARTNER');
    if (isCustomerOrPartner) {
      return res.json(success(riskEngineService.getCustomerSafeSummary(result)));
    }

    res.json(success(result));
  })
);

// ---------------------------------------------------------------------------
// 2. RE-EVALUATE APPLICATION (NEW VERSION)
// ---------------------------------------------------------------------------

router.post(
  '/re-evaluate',
  authorize('SUPER_ADMIN', 'ADMIN', 'COMPANY_ADMIN', 'RISK_MANAGER', 'RISK_ANALYST', 'UNDERWRITER'),
  asyncHandler(async (req, res) => {
    const body = evaluateRiskSchema.parse(req.body);
    const tenantId = req.user?.tenantId || 'tenant-adyapan-default';

    const result = await riskEngineService.evaluateApplication(
      body.applicationId,
      tenantId,
      body.overrides,
      req.user?.id
    );

    res.json(success(result));
  })
);

// ---------------------------------------------------------------------------
// 3. SIMULATE RISK ENGINE SCENARIO
// ---------------------------------------------------------------------------

router.post(
  '/simulate',
  authorize('SUPER_ADMIN', 'ADMIN', 'COMPANY_ADMIN', 'RISK_MANAGER', 'RISK_ANALYST', 'CREDIT_ANALYST', 'UNDERWRITER'),
  asyncHandler(async (req, res) => {
    const input = simulateRiskSchema.parse(req.body);
    const tenantId = req.user?.tenantId || 'tenant-adyapan-default';
    const dummyAppId = `sim-${Date.now()}`;

    const result = await riskEngineService.evaluateApplication(
      dummyAppId,
      tenantId,
      {
        applicantAge: input.applicantAge,
        monthlyIncome: input.monthlyIncome,
        existingObligations: input.existingObligations,
        workExperienceMonths: input.workExperienceMonths,
        bureauScore: input.bureauScore,
        averageMonthlyBalance: input.averageMonthlyBalance,
        chequeBouncesLast90d: input.chequeBouncesLast90d,
        requestedAmount: input.requestedAmount,
        requestedTenureMonths: input.requestedTenureMonths,
        applicationVelocity24h: input.applicationVelocity24h,
      },
      req.user?.id
    );

    res.json(success(result));
  })
);

// ---------------------------------------------------------------------------
// 4. GET EVALUATION SNAPSHOTS
// ---------------------------------------------------------------------------

router.get(
  '/evaluations/application/:applicationId',
  authorize('SUPER_ADMIN', 'ADMIN', 'COMPANY_ADMIN', 'RISK_MANAGER', 'RISK_ANALYST', 'CREDIT_ANALYST', 'UNDERWRITER', 'BRANCH_MANAGER', 'AUDITOR'),
  asyncHandler(async (req, res) => {
    const tenantId = req.user?.tenantId || 'tenant-adyapan-default';
    const latest = riskEngineService.getLatestEvaluation(tenantId, req.params.applicationId);
    const history = riskEngineService.listEvaluationHistory(tenantId, req.params.applicationId);

    const isCustomerOrPartner = req.user?.roles?.some((r) => r === 'CUSTOMER' || r === 'PARTNER');
    if (isCustomerOrPartner) {
      return res.json(success({ latest: riskEngineService.getCustomerSafeSummary(latest) }));
    }

    res.json(success({ latest, history, count: history.length }));
  })
);

router.get(
  '/evaluations/:id',
  authorize('SUPER_ADMIN', 'ADMIN', 'COMPANY_ADMIN', 'RISK_MANAGER', 'RISK_ANALYST', 'CREDIT_ANALYST', 'UNDERWRITER', 'AUDITOR'),
  asyncHandler(async (req, res) => {
    const tenantId = req.user?.tenantId || 'tenant-adyapan-default';
    // Look up across snapshots
    const history = riskEngineService.listEvaluationHistory(tenantId, req.params.id);
    if (history.length > 0) {
      return res.json(success(history[history.length - 1]));
    }
    const latest = riskEngineService.getLatestEvaluation(tenantId, req.params.id);
    res.json(success(latest));
  })
);

// ---------------------------------------------------------------------------
// 5. RISK POLICIES & VERSIONING
// ---------------------------------------------------------------------------

router.get(
  '/policies',
  authorize('SUPER_ADMIN', 'ADMIN', 'COMPANY_ADMIN', 'RISK_MANAGER', 'RISK_ANALYST', 'UNDERWRITER', 'AUDITOR'),
  asyncHandler(async (req, res) => {
    const tenantId = req.user?.tenantId || 'tenant-adyapan-default';
    const status = req.query.status as string | undefined;
    const policies = riskEngineService.listPolicies(tenantId, { status });
    res.json(success({ policies, count: policies.length }));
  })
);

router.post(
  '/policies',
  authorize('SUPER_ADMIN', 'ADMIN', 'COMPANY_ADMIN', 'RISK_MANAGER'),
  asyncHandler(async (req, res) => {
    const body = createRiskPolicySchema.parse(req.body);
    const tenantId = req.user?.tenantId || 'tenant-adyapan-default';

    const policy = riskEngineService.createPolicy(tenantId, body, req.user?.id);
    res.status(201).json(success(policy));
  })
);

router.get(
  '/policies/:id',
  authorize('SUPER_ADMIN', 'ADMIN', 'COMPANY_ADMIN', 'RISK_MANAGER', 'RISK_ANALYST', 'UNDERWRITER', 'AUDITOR'),
  asyncHandler(async (req, res) => {
    const tenantId = req.user?.tenantId || 'tenant-adyapan-default';
    const policy = riskEngineService.getPolicyById(tenantId, req.params.id);
    res.json(success(policy));
  })
);

router.put(
  '/policies/:id',
  authorize('SUPER_ADMIN', 'ADMIN', 'COMPANY_ADMIN', 'RISK_MANAGER'),
  asyncHandler(async (req, res) => {
    const tenantId = req.user?.tenantId || 'tenant-adyapan-default';
    const updated = riskEngineService.updatePolicy(tenantId, req.params.id, req.body);
    res.json(success(updated));
  })
);

router.post(
  '/policies/:id/publish',
  authorize('SUPER_ADMIN', 'ADMIN', 'COMPANY_ADMIN', 'RISK_MANAGER'),
  asyncHandler(async (req, res) => {
    const tenantId = req.user?.tenantId || 'tenant-adyapan-default';
    const published = riskEngineService.publishPolicy(tenantId, req.params.id, req.user?.id);
    res.json(success(published));
  })
);

// ---------------------------------------------------------------------------
// 6. MANUAL RISK OVERRIDE (SoD PROTECTED)
// ---------------------------------------------------------------------------

router.post(
  '/override',
  authorize('SUPER_ADMIN', 'ADMIN', 'COMPANY_ADMIN', 'RISK_MANAGER'),
  asyncHandler(async (req, res) => {
    const body = overrideRiskSchema.parse(req.body);
    const tenantId = req.user?.tenantId || 'tenant-adyapan-default';

    const overridden = await riskEngineService.overrideRiskScore(tenantId, body.applicationId, {
      newScore: body.newScore,
      newGrade: body.newGrade,
      reason: body.reason,
      comments: body.comments,
      overriddenBy: req.user?.id || 'risk-officer',
      overrideRole: req.user?.roles?.[0] || 'RISK_MANAGER',
    });

    res.json(success(overridden));
  })
);

// ---------------------------------------------------------------------------
// 7. COMPOSITE RISK X FRAUD MATRIX EVALUATION
// ---------------------------------------------------------------------------

router.post(
  '/matrix/evaluate',
  authorize('SUPER_ADMIN', 'ADMIN', 'COMPANY_ADMIN', 'RISK_MANAGER', 'RISK_ANALYST', 'UNDERWRITER'),
  asyncHandler(async (req, res) => {
    const { riskScore, fraudScore } = req.body;
    if (riskScore === undefined || fraudScore === undefined) {
      throw new BadRequestError('Both riskScore and fraudScore are required.');
    }
    const result = riskFraudMatrixService.evaluateMatrix(Number(riskScore), Number(fraudScore));
    res.json(success(result));
  })
);

export default router;
