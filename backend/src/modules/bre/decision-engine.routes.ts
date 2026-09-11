import { Router, Request, Response } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { tenantContext } from '../../middleware/tenant-context';
import { decisionEngineService } from './decision-engine.service';
import { asyncHandler } from '../../common/asyncHandler';
import { ok, created } from '../../common/response';

export const decisionEngineRoutes = Router();

decisionEngineRoutes.use(authenticate);
decisionEngineRoutes.use(tenantContext);

// ---------------------------------------------------------------------------
// 1. DECISION EVALUATION & SIMULATION (Registered first to avoid :id collisions)
// ---------------------------------------------------------------------------

/**
 * POST /api/v1/decision-engine/simulate
 * Run stateless BRE simulation against applicant parameters.
 */
decisionEngineRoutes.post(
  '/simulate',
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId || 'tenant-adyapan-default';
    const result = decisionEngineService.simulate(tenantId, req.body, req.user as any);
    return ok(res, result);
  })
);

/**
 * POST /api/v1/decision-engine/evaluate/:applicationId
 * Authoritative evaluation of live loan application against active product policy.
 */
decisionEngineRoutes.post(
  '/evaluate/:applicationId',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'UNDERWRITER', 'CREDIT_ANALYST', 'LOAN_OFFICER', 'BRANCH_MANAGER'),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await decisionEngineService.evaluateApplication(
      req.params.applicationId,
      req.user as any
    );
    return ok(res, result);
  })
);

/**
 * GET /api/v1/decision-engine/applications/:applicationId/decisions
 * Retrieve historical evaluation versions for an application.
 */
decisionEngineRoutes.get(
  '/applications/:applicationId/decisions',
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId || 'tenant-adyapan-default';
    const history = decisionEngineService.getApplicationDecisions(req.params.applicationId, tenantId);
    return ok(res, history);
  })
);

/**
 * POST /api/v1/decision-engine/decisions/:decisionId/override
 * Manual credit decision override by authorized role (Underwriter / Committee).
 */
decisionEngineRoutes.post(
  '/decisions/:decisionId/override',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'UNDERWRITER', 'BRANCH_MANAGER'),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId || 'tenant-adyapan-default';
    const updated = await decisionEngineService.overrideDecision(
      tenantId,
      req.params.decisionId,
      req.body,
      req.user as any
    );
    return ok(res, updated);
  })
);

/**
 * GET /api/v1/decision-engine/decisions/:decisionId
 * Retrieve specific decision snapshot record.
 */
decisionEngineRoutes.get(
  '/decisions/:decisionId',
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId || 'tenant-adyapan-default';
    const record = decisionEngineService.getDecisionById(req.params.decisionId, tenantId);
    return ok(res, record);
  })
);

// ---------------------------------------------------------------------------
// 2. DECISION POLICY MANAGEMENT
// ---------------------------------------------------------------------------

const listPoliciesHandler = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.tenantId || req.user?.tenantId || 'tenant-adyapan-default';
  const status = req.query.status as string | undefined;
  const search = req.query.search as string | undefined;
  const policies = decisionEngineService.listPolicies(tenantId, { status, search });
  return ok(res, policies);
});

const getPolicyHandler = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.tenantId || req.user?.tenantId || 'tenant-adyapan-default';
  const policy = decisionEngineService.getPolicyById(tenantId, req.params.id);
  return ok(res, policy);
});

const createPolicyHandler = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.tenantId || req.user?.tenantId || 'tenant-adyapan-default';
  const policy = await decisionEngineService.createPolicy(
    tenantId,
    req.body,
    req.user as any
  );
  return created(res, policy);
});

const updatePolicyHandler = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.tenantId || req.user?.tenantId || 'tenant-adyapan-default';
  const policy = await decisionEngineService.updatePolicyWithVersioning(
    tenantId,
    req.params.id,
    req.body,
    req.user as any
  );
  return ok(res, policy);
});

const createVersionHandler = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.tenantId || req.user?.tenantId || 'tenant-adyapan-default';
  const policy = await decisionEngineService.createPolicyVersion(
    tenantId,
    req.params.id,
    req.user as any
  );
  return created(res, policy);
});

const activatePolicyHandler = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.tenantId || req.user?.tenantId || 'tenant-adyapan-default';
  const policy = await decisionEngineService.activatePolicy(
    tenantId,
    req.params.id,
    req.user as any
  );
  return ok(res, policy);
});

const archivePolicyHandler = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.tenantId || req.user?.tenantId || 'tenant-adyapan-default';
  const policy = await decisionEngineService.archivePolicy(
    tenantId,
    req.params.id,
    req.user as any
  );
  return ok(res, policy);
});

// Specific action sub-paths on policies
decisionEngineRoutes.post('/policies/:id/versions', authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'UNDERWRITER'), createVersionHandler);
decisionEngineRoutes.post('/policies/:id/activate', authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'UNDERWRITER'), activatePolicyHandler);
decisionEngineRoutes.post('/policies/:id/archive', authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN'), archivePolicyHandler);

// Standard policy endpoints
decisionEngineRoutes.get('/policies', listPoliciesHandler);
decisionEngineRoutes.post('/policies', authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'UNDERWRITER'), createPolicyHandler);
decisionEngineRoutes.get('/policies/:id', getPolicyHandler);
decisionEngineRoutes.put('/policies/:id', authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'UNDERWRITER'), updatePolicyHandler);
decisionEngineRoutes.patch('/policies/:id', authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'UNDERWRITER'), updatePolicyHandler);

// Top-level / aliases (when mounted on /decision-policies)
decisionEngineRoutes.get('/', listPoliciesHandler);
decisionEngineRoutes.post('/', authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'UNDERWRITER'), createPolicyHandler);
decisionEngineRoutes.post('/:id/versions', authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'UNDERWRITER'), createVersionHandler);
decisionEngineRoutes.post('/:id/activate', authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'UNDERWRITER'), activatePolicyHandler);
decisionEngineRoutes.post('/:id/archive', authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN'), archivePolicyHandler);
decisionEngineRoutes.get('/:id', getPolicyHandler);
decisionEngineRoutes.put('/:id', authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'UNDERWRITER'), updatePolicyHandler);
decisionEngineRoutes.patch('/:id', authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'UNDERWRITER'), updatePolicyHandler);

export default decisionEngineRoutes;
