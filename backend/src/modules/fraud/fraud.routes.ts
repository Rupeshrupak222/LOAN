import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../common/asyncHandler';
import { success } from '../../common/response';
import { authenticate, authorize } from '../../middleware/auth';
import { fraudService } from './fraud.service';
import { identityGraphService } from './identity-graph.service';
import { fraudRulesEngine } from './fraud-rules.engine';
import { BadRequestError, ForbiddenError } from '../../common/errors';

const router = Router();

router.use(authenticate);

// ---------------------------------------------------------------------------
// ZOD SCHEMAS
// ---------------------------------------------------------------------------

const evaluateFraudSchema = z.object({
  applicationId: z.string().min(1),
  overrides: z.record(z.any()).optional(),
});

const createFraudRuleSchema = z.object({
  productId: z.string().optional(),
  code: z.string().min(3),
  name: z.string().min(3),
  description: z.string().min(5),
  category: z.enum(['IDENTITY', 'BANK_ACCOUNT', 'DEVICE', 'NETWORK', 'APPLICATION_VELOCITY']),
  field: z.string().min(1),
  operator: z.enum(['EQUALS', 'NOT_EQUALS', 'GREATER_THAN', 'GREATER_THAN_OR_EQUAL', 'LESS_THAN', 'LESS_THAN_OR_EQUAL', 'CONTAINS', 'IN', 'EXISTS', 'FUZZY_MATCH_BELOW']),
  expectedValue: z.any(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  scoreImpact: z.number().min(0).max(100),
  reasonCode: z.string().min(2),
  enabled: z.boolean().default(true),
});

const createFraudCaseSchema = z.object({
  applicationId: z.string().min(1),
  notes: z.string().optional(),
  assignedToUserId: z.string().optional(),
});

const assignCaseSchema = z.object({
  assignedToUserId: z.string().min(1),
  assignedToName: z.string().min(1),
});

const addEvidenceSchema = z.object({
  type: z.enum(['DOCUMENT', 'BANK_STATEMENT', 'DEVICE_FINGERPRINT', 'IP_LOOKUP', 'IDENTITY_GRAPH', 'EXTERNAL_REPORT']),
  title: z.string().min(3),
  description: z.string().min(5),
  uri: z.string().optional(),
});

const addNoteSchema = z.object({
  note: z.string().min(3),
});

const resolveCaseSchema = z.object({
  resolution: z.enum(['CLEARED', 'CONFIRMED_FRAUD', 'FALSE_POSITIVE', 'REJECTED_LOAN']),
  reason: z.string().min(5),
});

const overrideFraudSchema = z.object({
  applicationId: z.string().min(1),
  newOutcome: z.enum(['CLEAR', 'LOW_RISK', 'REVIEW', 'HIGH_RISK', 'BLOCK']),
  newScore: z.number().min(0).max(100).optional(),
  reason: z.string().min(5),
  comments: z.string().default('Manual fraud outcome override recorded by authorized officer.'),
});

// ---------------------------------------------------------------------------
// 1. EVALUATE APPLICATION FRAUD
// ---------------------------------------------------------------------------

router.post(
  '/evaluate',
  authorize('SUPER_ADMIN', 'ADMIN', 'COMPANY_ADMIN', 'RISK_MANAGER', 'FRAUD_ANALYST', 'UNDERWRITER'),
  asyncHandler(async (req, res) => {
    const body = evaluateFraudSchema.parse(req.body);
    const tenantId = req.user?.tenantId || 'tenant-adyapan-default';

    const result = await fraudService.evaluateApplication(
      body.applicationId,
      tenantId,
      body.overrides,
      req.user?.id
    );

    const isCustomerOrPartner = req.user?.roles?.some((r) => r === 'CUSTOMER' || r === 'PARTNER');
    if (isCustomerOrPartner) {
      return res.json(success(fraudService.getCustomerSafeSummary(result)));
    }

    res.json(success(result));
  })
);

// ---------------------------------------------------------------------------
// 2. GET EVALUATION SNAPSHOTS
// ---------------------------------------------------------------------------

router.get(
  '/evaluations/application/:applicationId',
  authorize('SUPER_ADMIN', 'ADMIN', 'COMPANY_ADMIN', 'RISK_MANAGER', 'FRAUD_ANALYST', 'UNDERWRITER', 'AUDITOR'),
  asyncHandler(async (req, res) => {
    const tenantId = req.user?.tenantId || 'tenant-adyapan-default';
    const latest = fraudService.getLatestEvaluation(tenantId, req.params.applicationId);
    const history = fraudService.listEvaluationHistory(tenantId, req.params.applicationId);

    const isCustomerOrPartner = req.user?.roles?.some((r) => r === 'CUSTOMER' || r === 'PARTNER');
    if (isCustomerOrPartner) {
      return res.json(success({ latest: fraudService.getCustomerSafeSummary(latest) }));
    }

    res.json(success({ latest, history, count: history.length }));
  })
);

router.get(
  '/evaluations/:id',
  authorize('SUPER_ADMIN', 'ADMIN', 'COMPANY_ADMIN', 'RISK_MANAGER', 'FRAUD_ANALYST', 'UNDERWRITER', 'AUDITOR'),
  asyncHandler(async (req, res) => {
    const tenantId = req.user?.tenantId || 'tenant-adyapan-default';
    const history = fraudService.listEvaluationHistory(tenantId, req.params.id);
    if (history.length > 0) {
      return res.json(success(history[history.length - 1]));
    }
    const latest = fraudService.getLatestEvaluation(tenantId, req.params.id);
    res.json(success(latest));
  })
);

// ---------------------------------------------------------------------------
// 3. DUPLICATE & IDENTITY GRAPH EXPLORER
// ---------------------------------------------------------------------------

router.get(
  '/graph/:customerId',
  authorize('SUPER_ADMIN', 'ADMIN', 'COMPANY_ADMIN', 'RISK_MANAGER', 'FRAUD_ANALYST', 'UNDERWRITER'),
  asyncHandler(async (req, res) => {
    const tenantId = req.user?.tenantId || 'tenant-adyapan-default';
    const cluster = identityGraphService.buildCluster(tenantId, req.params.customerId);
    res.json(success(cluster));
  })
);

// ---------------------------------------------------------------------------
// 4. FRAUD RULES ENGINE MANAGEMENT
// ---------------------------------------------------------------------------

router.get(
  '/rules',
  authorize('SUPER_ADMIN', 'ADMIN', 'COMPANY_ADMIN', 'RISK_MANAGER', 'FRAUD_ANALYST', 'UNDERWRITER', 'AUDITOR'),
  asyncHandler(async (req, res) => {
    const tenantId = req.user?.tenantId || 'tenant-adyapan-default';
    const category = req.query.category as string | undefined;
    const rules = fraudRulesEngine.listRules(tenantId, { category });
    res.json(success({ rules, count: rules.length }));
  })
);

router.post(
  '/rules',
  authorize('SUPER_ADMIN', 'ADMIN', 'COMPANY_ADMIN', 'RISK_MANAGER'),
  asyncHandler(async (req, res) => {
    const body = createFraudRuleSchema.parse(req.body);
    const tenantId = req.user?.tenantId || 'tenant-adyapan-default';
    const rule = fraudRulesEngine.createRule(tenantId, body as any);
    res.status(201).json(success(rule));
  })
);

router.put(
  '/rules/:id',
  authorize('SUPER_ADMIN', 'ADMIN', 'COMPANY_ADMIN', 'RISK_MANAGER'),
  asyncHandler(async (req, res) => {
    const tenantId = req.user?.tenantId || 'tenant-adyapan-default';
    const rule = fraudRulesEngine.updateRule(tenantId, req.params.id, req.body);
    res.json(success(rule));
  })
);

// ---------------------------------------------------------------------------
// 5. FRAUD INVESTIGATION CASE DESK
// ---------------------------------------------------------------------------

router.get(
  '/cases',
  authorize('SUPER_ADMIN', 'ADMIN', 'COMPANY_ADMIN', 'RISK_MANAGER', 'FRAUD_ANALYST', 'UNDERWRITER', 'AUDITOR'),
  asyncHandler(async (req, res) => {
    const tenantId = req.user?.tenantId || 'tenant-adyapan-default';
    const status = req.query.status as any;
    const assignedTo = req.query.assignedToUserId as string | undefined;
    const cases = fraudService.listCases(tenantId, { status, assignedToUserId: assignedTo });
    res.json(success({ cases, count: cases.length }));
  })
);

router.post(
  '/cases',
  authorize('SUPER_ADMIN', 'ADMIN', 'COMPANY_ADMIN', 'RISK_MANAGER', 'FRAUD_ANALYST'),
  asyncHandler(async (req, res) => {
    const body = createFraudCaseSchema.parse(req.body);
    const tenantId = req.user?.tenantId || 'tenant-adyapan-default';
    const fraudCase = fraudService.createCase(tenantId, body, req.user?.id);
    res.status(201).json(success(fraudCase));
  })
);

router.get(
  '/cases/:id',
  authorize('SUPER_ADMIN', 'ADMIN', 'COMPANY_ADMIN', 'RISK_MANAGER', 'FRAUD_ANALYST', 'UNDERWRITER', 'AUDITOR'),
  asyncHandler(async (req, res) => {
    const tenantId = req.user?.tenantId || 'tenant-adyapan-default';
    const fraudCase = fraudService.getCaseById(tenantId, req.params.id);
    res.json(success(fraudCase));
  })
);

router.post(
  '/cases/:id/assign',
  authorize('SUPER_ADMIN', 'ADMIN', 'COMPANY_ADMIN', 'RISK_MANAGER', 'FRAUD_ANALYST'),
  asyncHandler(async (req, res) => {
    const body = assignCaseSchema.parse(req.body);
    const tenantId = req.user?.tenantId || 'tenant-adyapan-default';
    const updated = fraudService.assignCase(
      tenantId,
      req.params.id,
      body.assignedToUserId,
      body.assignedToName,
      req.user?.id
    );
    res.json(success(updated));
  })
);

router.post(
  '/cases/:id/evidence',
  authorize('SUPER_ADMIN', 'ADMIN', 'COMPANY_ADMIN', 'RISK_MANAGER', 'FRAUD_ANALYST'),
  asyncHandler(async (req, res) => {
    const body = addEvidenceSchema.parse(req.body);
    const tenantId = req.user?.tenantId || 'tenant-adyapan-default';
    const updated = fraudService.addCaseEvidence(tenantId, req.params.id, {
      ...body,
      addedBy: req.user?.email || 'Fraud Investigator',
    });
    res.json(success(updated));
  })
);

router.post(
  '/cases/:id/notes',
  authorize('SUPER_ADMIN', 'ADMIN', 'COMPANY_ADMIN', 'RISK_MANAGER', 'FRAUD_ANALYST'),
  asyncHandler(async (req, res) => {
    const body = addNoteSchema.parse(req.body);
    const tenantId = req.user?.tenantId || 'tenant-adyapan-default';
    const updated = fraudService.addCaseNote(tenantId, req.params.id, body.note, {
      id: req.user?.id || 'unknown',
      name: req.user?.email || 'Investigator',
      role: req.user?.roles?.[0] || 'FRAUD_ANALYST',
    });
    res.json(success(updated));
  })
);

router.post(
  '/cases/:id/resolve',
  authorize('SUPER_ADMIN', 'ADMIN', 'COMPANY_ADMIN', 'RISK_MANAGER', 'FRAUD_ANALYST'),
  asyncHandler(async (req, res) => {
    const body = resolveCaseSchema.parse(req.body);
    const tenantId = req.user?.tenantId || 'tenant-adyapan-default';
    const resolved = fraudService.resolveCase(
      tenantId,
      req.params.id,
      body,
      req.user?.id || 'fraud-officer'
    );
    res.json(success(resolved));
  })
);

// ---------------------------------------------------------------------------
// 6. MANUAL FRAUD OUTCOME OVERRIDE (SoD PROTECTED)
// ---------------------------------------------------------------------------

router.post(
  '/override',
  authorize('SUPER_ADMIN', 'ADMIN', 'COMPANY_ADMIN', 'RISK_MANAGER'),
  asyncHandler(async (req, res) => {
    const body = overrideFraudSchema.parse(req.body);
    const tenantId = req.user?.tenantId || 'tenant-adyapan-default';

    const overridden = await fraudService.overrideFraudOutcome(tenantId, body.applicationId, {
      newOutcome: body.newOutcome,
      newScore: body.newScore,
      reason: body.reason,
      comments: body.comments,
      overriddenBy: req.user?.id || 'fraud-manager',
      overrideRole: req.user?.roles?.[0] || 'RISK_MANAGER',
    });

    res.json(success(overridden));
  })
);

export default router;
