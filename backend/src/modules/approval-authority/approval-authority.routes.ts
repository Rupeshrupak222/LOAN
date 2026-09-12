import { Router, Request, Response } from 'express';
import { authenticate, authorize } from '../../middleware/auth';
import { tenantContext } from '../../middleware/tenant-context';
import { approvalAuthorityService } from './approval-authority.service';
import { asyncHandler } from '../../common/asyncHandler';
import { ok, created } from '../../common/response';

export const approvalAuthorityRoutes = Router();

approvalAuthorityRoutes.use(authenticate);
approvalAuthorityRoutes.use(tenantContext);

// ---------------------------------------------------------------------------
// 1. APPROVAL QUEUE & TASK EXECUTION
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/approval-queue & /api/v1/approval-authorities/queue
 * Returns approval tasks eligible for the current logged-in approver based on role, branch, and delegations.
 */
const getApprovalQueueHandler = asyncHandler(async (req: Request, res: Response) => {
  const actor = req.user as any;
  const tab = req.query.tab as string | undefined;
  const search = req.query.search as string | undefined;
  const tasks = approvalAuthorityService.getApprovalQueue(actor, { tab, search });
  return ok(res, tasks);
});

approvalAuthorityRoutes.get('/queue', getApprovalQueueHandler);

/**
 * POST /api/v1/approval-authorities/resolve
 * Direct resolution simulation with payload
 */
approvalAuthorityRoutes.post(
  '/resolve',
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId || 'tenant-adyapan-default';
    const resolution = await approvalAuthorityService.resolveAuthorityDirect(
      tenantId,
      req.body,
      req.user as any
    );
    return ok(res, resolution);
  })
);

/**
 * GET /api/v1/approval-tasks/:id
 * Retrieve single approval task detail.
 */
approvalAuthorityRoutes.get(
  '/tasks/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId || 'tenant-adyapan-default';
    const task = approvalAuthorityService.getApprovalTaskById(tenantId, req.params.id);
    return ok(res, task);
  })
);

/**
 * POST /api/v1/approval-tasks/:id/action
 * Execute decision action on task (APPROVE, REJECT, SEND_BACK, ESCALATE, DELEGATE).
 */
approvalAuthorityRoutes.post(
  '/tasks/:id/action',
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId || 'tenant-adyapan-default';
    const updatedTask = await approvalAuthorityService.executeApprovalAction(
      tenantId,
      req.params.id,
      req.body,
      req.user as any
    );
    return ok(res, updatedTask);
  })
);

/**
 * POST /api/v1/approval-tasks/:id/approve
 */
approvalAuthorityRoutes.post(
  '/tasks/:id/approve',
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId || 'tenant-adyapan-default';
    const updatedTask = await approvalAuthorityService.executeApprovalAction(
      tenantId,
      req.params.id,
      { action: 'APPROVE', comments: req.body?.comments || 'Sanction approved within delegated authority.' },
      req.user as any
    );
    return ok(res, updatedTask);
  })
);

/**
 * POST /api/v1/approval-tasks/:id/reject
 */
approvalAuthorityRoutes.post(
  '/tasks/:id/reject',
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId || 'tenant-adyapan-default';
    const updatedTask = await approvalAuthorityService.executeApprovalAction(
      tenantId,
      req.params.id,
      {
        action: 'REJECT',
        reason: req.body?.reason || 'CREDIT_POLICY_DECLINE',
        comments: req.body?.comments || 'Proposal declined.',
      },
      req.user as any
    );
    return ok(res, updatedTask);
  })
);

/**
 * POST /api/v1/approval-tasks/:id/send-back
 */
approvalAuthorityRoutes.post(
  '/tasks/:id/send-back',
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId || 'tenant-adyapan-default';
    const updatedTask = await approvalAuthorityService.executeApprovalAction(
      tenantId,
      req.params.id,
      {
        action: 'SEND_BACK',
        reason: req.body?.reason || 'INFORMATION_REQUIRED',
        comments: req.body?.comments || 'Sent back for clarification.',
        sendBackTargetStage: req.body?.sendBackTargetStage || 'CREDIT_ASSESSMENT',
      },
      req.user as any
    );
    return ok(res, updatedTask);
  })
);

/**
 * POST /api/v1/approval-tasks/:id/escalate
 */
approvalAuthorityRoutes.post(
  '/tasks/:id/escalate',
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId || 'tenant-adyapan-default';
    const updatedTask = await approvalAuthorityService.executeApprovalAction(
      tenantId,
      req.params.id,
      {
        action: 'ESCALATE',
        reason: req.body?.reason || 'AMOUNT_OR_RISK_EXCEPTION',
        comments: req.body?.comments || 'Escalated to higher authority level.',
        escalateToLevel: req.body?.escalateToLevel,
      },
      req.user as any
    );
    return ok(res, updatedTask);
  })
);

// ---------------------------------------------------------------------------
// 2. APPLICATION RESOLUTION & HISTORY
// ---------------------------------------------------------------------------

/**
 * POST /api/v1/applications/:applicationId/resolve-approval-authority
 * Dynamically resolves required authority hierarchy for an application.
 */
approvalAuthorityRoutes.post(
  '/applications/:applicationId/resolve-authority',
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId || 'tenant-adyapan-default';
    const resolution = await approvalAuthorityService.resolveApprovalAuthority(
      req.params.applicationId,
      tenantId,
      req.user as any
    );
    return ok(res, resolution);
  })
);

/**
 * GET /api/v1/applications/:applicationId/approval-history
 * Retrieve immutable approval snapshot timeline for an application.
 */
approvalAuthorityRoutes.get(
  '/applications/:applicationId/history',
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId || 'tenant-adyapan-default';
    const history = approvalAuthorityService.getApplicationApprovalHistory(tenantId, req.params.applicationId);
    return ok(res, history);
  })
);

// ---------------------------------------------------------------------------
// 3. TEMPORARY DELEGATION MANAGEMENT
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/delegations
 * List delegations for current tenant.
 */
approvalAuthorityRoutes.get(
  '/delegations',
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId || 'tenant-adyapan-default';
    const list = approvalAuthorityService.listDelegations(tenantId);
    return ok(res, list);
  })
);

/**
 * POST /api/v1/delegations
 * Create temporary delegation.
 */
approvalAuthorityRoutes.post(
  '/delegations',
  authorize('BRANCH_MANAGER', 'UNDERWRITER', 'CREDIT_HEAD', 'ADMIN', 'SUPER_ADMIN', 'COMPANY_ADMIN'),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId || 'tenant-adyapan-default';
    const delegation = await approvalAuthorityService.createDelegation(
      tenantId,
      req.body,
      req.user as any
    );
    return created(res, delegation);
  })
);

/**
 * POST /api/v1/delegations/:id/revoke
 * Revoke active delegation.
 */
approvalAuthorityRoutes.post(
  '/delegations/:id/revoke',
  authorize('BRANCH_MANAGER', 'UNDERWRITER', 'CREDIT_HEAD', 'ADMIN', 'SUPER_ADMIN', 'COMPANY_ADMIN'),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.tenantId || req.user?.tenantId || 'tenant-adyapan-default';
    const revoked = await approvalAuthorityService.revokeDelegation(
      tenantId,
      req.params.id,
      req.user as any
    );
    return ok(res, revoked);
  })
);

// ---------------------------------------------------------------------------
// 4. AUTHORITY MATRIX POLICY MANAGEMENT
// ---------------------------------------------------------------------------

const listPoliciesHandler = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.tenantId || req.user?.tenantId || 'tenant-adyapan-default';
  const status = req.query.status as string | undefined;
  const search = req.query.search as string | undefined;
  const policies = approvalAuthorityService.listPolicies(tenantId, { status, search });
  return ok(res, policies);
});

const getPolicyHandler = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.tenantId || req.user?.tenantId || 'tenant-adyapan-default';
  const policy = approvalAuthorityService.getPolicyById(tenantId, req.params.id);
  return ok(res, policy);
});

const createPolicyHandler = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.tenantId || req.user?.tenantId || 'tenant-adyapan-default';
  const policy = await approvalAuthorityService.createPolicy(
    tenantId,
    req.body,
    req.user as any
  );
  return created(res, policy);
});

const updatePolicyHandler = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.tenantId || req.user?.tenantId || 'tenant-adyapan-default';
  const policy = await approvalAuthorityService.updatePolicy(
    tenantId,
    req.params.id,
    req.body,
    req.user as any
  );
  return ok(res, policy);
});

const createVersionHandler = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.tenantId || req.user?.tenantId || 'tenant-adyapan-default';
  const policy = await approvalAuthorityService.createPolicyVersion(
    tenantId,
    req.params.id,
    req.user as any
  );
  return created(res, policy);
});

const activatePolicyHandler = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.tenantId || req.user?.tenantId || 'tenant-adyapan-default';
  const policy = await approvalAuthorityService.activatePolicy(
    tenantId,
    req.params.id,
    req.user as any
  );
  return ok(res, policy);
});

const archivePolicyHandler = asyncHandler(async (req: Request, res: Response) => {
  const tenantId = req.tenantId || req.user?.tenantId || 'tenant-adyapan-default';
  const policy = await approvalAuthorityService.archivePolicy(
    tenantId,
    req.params.id,
    req.user as any
  );
  return ok(res, policy);
});

// Policies Sub-endpoints
approvalAuthorityRoutes.post('/policies/:id/versions', authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN'), createVersionHandler);
approvalAuthorityRoutes.post('/policies/:id/activate', authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN'), activatePolicyHandler);
approvalAuthorityRoutes.post('/policies/:id/archive', authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN'), archivePolicyHandler);

approvalAuthorityRoutes.get('/policies', listPoliciesHandler);
approvalAuthorityRoutes.post('/policies', authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN'), createPolicyHandler);
approvalAuthorityRoutes.get('/policies/:id', getPolicyHandler);
approvalAuthorityRoutes.put('/policies/:id', authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN'), updatePolicyHandler);
approvalAuthorityRoutes.patch('/policies/:id', authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN'), updatePolicyHandler);

// Top-level aliases
approvalAuthorityRoutes.get('/', listPoliciesHandler);
approvalAuthorityRoutes.post('/', authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN'), createPolicyHandler);
approvalAuthorityRoutes.post('/:id/versions', authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN'), createVersionHandler);
approvalAuthorityRoutes.post('/:id/activate', authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN'), activatePolicyHandler);
approvalAuthorityRoutes.post('/:id/archive', authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN'), archivePolicyHandler);
approvalAuthorityRoutes.get('/:id', getPolicyHandler);
approvalAuthorityRoutes.put('/:id', authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN'), updatePolicyHandler);
approvalAuthorityRoutes.patch('/:id', authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN'), updatePolicyHandler);

export default approvalAuthorityRoutes;
