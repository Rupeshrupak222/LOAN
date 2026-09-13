import { Router } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { success } from '../../common/response';
import { validate } from '../../middleware/validate';
import { authenticate, authorize } from '../../middleware/auth';
import { underwritingDecisionSchema, resolveDeviationSchema } from './underwriting.schema';
import {
  getUnderwritingQueue,
  getUnderwritingWorkspace,
  resolveApplicationDeviation,
  submitUnderwritingDecision,
} from './underwriting.service';

const router = Router();

router.use(authenticate);

// 1. Underwriting Queue (filtered by tab and search)
router.get(
  '/queue',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'UNDERWRITER', 'CREDIT_HEAD', 'BRANCH_MANAGER'),
  asyncHandler(async (req, res) => {
    const tab = (req.query as any)?.tab;
    const search = (req.query as any)?.search;
    const queue = await getUnderwritingQueue(tab, search, {
      id: req.user?.id,
      roles: req.user?.roles,
      tenantId: req.tenantId || req.user?.tenantId,
      branchId: req.user?.branchId,
    });
    res.json(success(queue));
  })
);

// 2. Consolidated Underwriting Workspace (11-section model)
router.get(
  '/:applicationId/workspace',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'UNDERWRITER', 'CREDIT_HEAD', 'BRANCH_MANAGER'),
  asyncHandler(async (req, res) => {
    const workspace = await getUnderwritingWorkspace(req.params.applicationId, {
      id: req.user!.id,
      email: req.user!.email,
      roles: req.user!.roles,
      tenantId: req.tenantId || req.user?.tenantId,
      branchId: req.user?.branchId,
    });
    res.json(success(workspace));
  })
);

// 3. Deviations Resolution
router.post(
  '/:applicationId/deviations/:deviationId/resolve',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'UNDERWRITER', 'CREDIT_HEAD'),
  validate(resolveDeviationSchema),
  asyncHandler(async (req, res) => {
    const resolved = await resolveApplicationDeviation(
      req.params.applicationId,
      req.params.deviationId,
      req.body,
      {
        id: req.user!.id,
        email: req.user!.email,
        roles: req.user!.roles,
        tenantId: req.tenantId || req.user?.tenantId,
        branchId: req.user?.branchId,
      }
    );
    res.json(success(resolved));
  })
);

// 4. Underwriting Decision Commit
router.post(
  '/:applicationId/decision',
  authorize('SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN', 'UNDERWRITER'),
  validate(underwritingDecisionSchema),
  asyncHandler(async (req, res) => {
    const result = await submitUnderwritingDecision(
      req.params.applicationId,
      req.body,
      {
        id: req.user!.id,
        email: req.user!.email,
        roles: req.user!.roles,
        tenantId: req.tenantId || req.user?.tenantId,
        branchId: req.user?.branchId,
      }
    );
    res.json(success(result));
  })
);

export default router;

