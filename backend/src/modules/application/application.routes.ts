import { Router } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { ForbiddenError, BadRequestError } from '../../common/errors';
import { created, ok, paginated } from '../../common/response';
import { getPageParams } from '../../common/pagination';
import { authenticate, authorize } from '../../middleware/auth';
import { tenantContext } from '../../middleware/tenant-context';
import { validate } from '../../middleware/validate';
import { createApplicationSchema, transitionSchema } from './application.schema';
import * as service from './application.service';
import { workflowTransitionService } from '../workflows/workflow-transition.service';

const router = Router();
router.use(authenticate);
router.use(tenantContext);

const INTAKE_ROLES = ['CUSTOMER', 'LOAN_OFFICER', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN'];

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const params = getPageParams(req);
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const isStaff = req.user?.roles.some((r) =>
      ['SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'LOAN_OFFICER', 'CREDIT_ANALYST', 'UNDERWRITER', 'BRANCH_MANAGER', 'AUDITOR', 'COLLECTION_OFFICER', 'FINANCE_OFFICER'].includes(r)
    );
    const userIdFilter = isStaff ? undefined : req.user?.id;
    const result = await service.listApplications(params, status, userIdFilter, {
      id: req.user?.id,
      roles: req.user?.roles,
      tenantId: req.tenantId || req.user?.tenantId,
      branchId: req.user?.branchId,
    });
    return paginated(res, result.data, result.pagination);
  }),
);

router.get(
  '/returned',
  asyncHandler(async (req, res) => {
    const params = getPageParams(req);
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const stage = typeof req.query.stage === 'string' ? req.query.stage : undefined;
    const result = await service.listReturnedApplications(
      params,
      {
        id: req.user?.id,
        roles: req.user?.roles,
        tenantId: req.tenantId || req.user?.tenantId,
        branchId: req.user?.branchId,
      },
      search,
      stage
    );
    return ok(res, result);
  }),
);

/**
 * GET /api/v1/applications/:id/workflow-state
 * Evaluates and returns authoritative stage-gate status, completed prerequisites, pending blockers, and next action.
 */
router.get(
  '/:id/workflow-state',
  asyncHandler(async (req, res) => {
    const targetStatus = typeof req.query.targetStatus === 'string' ? (req.query.targetStatus as any) : undefined;
    const app = await service.getApplication(req.params.id, {
      id: req.user?.id,
      roles: req.user?.roles,
      tenantId: req.tenantId || req.user?.tenantId,
      branchId: req.user?.branchId,
    });

    const isStaff = req.user?.roles.some((r) =>
      ['SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'LOAN_OFFICER', 'CREDIT_ANALYST', 'UNDERWRITER', 'BRANCH_MANAGER', 'AUDITOR', 'COLLECTION_OFFICER', 'FINANCE_OFFICER'].includes(r)
    );
    if (!isStaff && app.customer?.userId !== req.user?.id) {
      throw new ForbiddenError('Access forbidden: You cannot view another borrower loan application workflow state');
    }

    const evaluation = await workflowTransitionService.evaluateTransitionEligibility(
      req.params.id,
      targetStatus || app.status,
      {
        id: req.user?.id,
        roles: req.user?.roles,
        tenantId: req.tenantId || req.user?.tenantId,
        branchId: req.user?.branchId,
      }
    );

    // If borrower, redact internal metadata and decision notes
    if (!isStaff) {
      return ok(res, {
        applicationId: evaluation.applicationId,
        applicationNo: evaluation.applicationNo,
        currentStatus: evaluation.currentStatus,
        completedPrerequisites: evaluation.completedPrerequisites.map((p) => ({ key: p.key, label: p.label, passed: p.passed })),
        pendingPrerequisites: evaluation.pendingPrerequisites.map((p) => ({ key: p.key, label: p.label, passed: p.passed, requiredCondition: p.requiredCondition })),
        nextValidAction: evaluation.nextValidAction,
      });
    }

    return ok(res, evaluation);
  }),
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const app = await service.getApplication(req.params.id, {
      id: req.user?.id,
      roles: req.user?.roles,
      tenantId: req.tenantId || req.user?.tenantId,
      branchId: req.user?.branchId,
    });
    const isStaff = req.user?.roles.some((r) =>
      ['SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'LOAN_OFFICER', 'CREDIT_ANALYST', 'UNDERWRITER', 'BRANCH_MANAGER', 'AUDITOR', 'COLLECTION_OFFICER', 'FINANCE_OFFICER'].includes(r)
    );
    if (!isStaff && app.customer?.userId !== req.user?.id) {
      throw new ForbiddenError('Access forbidden: You cannot view another borrower loan application');
    }
    return ok(res, app);
  }),
);

router.post(
  '/',
  authorize(...INTAKE_ROLES),
  validate({ body: createApplicationSchema }),
  asyncHandler(async (req, res) =>
    created(
      res,
      await service.createApplication(req.body, {
        id: req.user?.id,
        roles: req.user?.roles,
        tenantId: req.tenantId || req.user?.tenantId,
        branchId: req.user?.branchId,
      })
    )
  ),
);

/**
 * PATCH /api/v1/applications/:id
 * Updates draft loan application parameters before submission.
 */
router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const app = await service.getApplication(req.params.id, {
      id: req.user?.id,
      roles: req.user?.roles,
      tenantId: req.tenantId || req.user?.tenantId,
      branchId: req.user?.branchId,
    });
    const isStaff = req.user?.roles.some((r) =>
      ['SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'LOAN_OFFICER', 'BRANCH_MANAGER'].includes(r)
    );
    if (!isStaff && app.customer?.userId !== req.user?.id) {
      throw new ForbiddenError('Access forbidden: You cannot modify another borrower application');
    }
    if (app.status !== 'DRAFT' && app.status !== 'KYC_PENDING') {
      throw new BadRequestError(`Cannot modify application in '${app.status}' state. Only draft applications can be edited.`);
    }

    const updated = await service.updateDraftApplication(req.params.id, req.body, {
      id: req.user?.id,
      roles: req.user?.roles,
      tenantId: req.tenantId || req.user?.tenantId,
      branchId: req.user?.branchId,
    });
    return ok(res, updated);
  }),
);

/**
 * POST /api/v1/applications/:id/submit
 * Submits application into the origination and credit review pipeline.
 */
router.post(
  '/:id/submit',
  asyncHandler(async (req, res) => {
    const app = await service.getApplication(req.params.id, {
      id: req.user?.id,
      roles: req.user?.roles,
      tenantId: req.tenantId || req.user?.tenantId,
      branchId: req.user?.branchId,
    });
    const isStaff = req.user?.roles.some((r) =>
      ['SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'LOAN_OFFICER', 'BRANCH_MANAGER'].includes(r)
    );
    if (!isStaff && app.customer?.userId !== req.user?.id) {
      throw new ForbiddenError('Access forbidden: You cannot submit another borrower application');
    }

    const transitioned = await service.transition(
      req.params.id,
      'SUBMITTED',
      req.user!.id,
      req.body?.reason || 'Customer submitted digital application for underwriting review',
      {
        id: req.user?.id,
        roles: req.user?.roles,
        tenantId: req.tenantId || req.user?.tenantId,
        branchId: req.user?.branchId,
      }
    );
    return ok(res, transitioned);
  }),
);

/**
 * POST /api/v1/applications/:id/transition
 * Authoritative state transition endpoint validating workflow stage graph, prerequisites, and SoD.
 */
router.post(
  '/:id/transition',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'LOAN_OFFICER', 'BRANCH_MANAGER', 'CREDIT_ANALYST', 'UNDERWRITER', 'FINANCE_OFFICER', 'DISBURSEMENT_OFFICER', 'CUSTOMER'),
  validate({ body: transitionSchema }),
  asyncHandler(async (req, res) => {
    return ok(
      res,
      await service.transition(
        req.params.id,
        req.body.toStatus,
        req.user!.id,
        req.body.reason,
        {
          id: req.user?.id,
          roles: req.user?.roles,
          tenantId: req.tenantId || req.user?.tenantId,
          branchId: req.user?.branchId,
        }
      )
    );
  }),
);

export default router;
